import React, { useState, useRef } from 'react';
import { injectIntl } from 'react-intl';
import { makeStyles } from '@material-ui/core/styles';
import PersonIcon from '@material-ui/icons/Person';

import TextField from '@material-ui/core/TextField';
import Autocomplete from '@material-ui/lab/Autocomplete';

import Snackbar from '@material-ui/core/Snackbar';
import MuiAlert from '@material-ui/lab/Alert';

import Typography from '@material-ui/core/Typography';
import FormControl from '@material-ui/core/FormControl';
import FormHelperText from '@material-ui/core/FormHelperText';

import Grid from '@material-ui/core/Grid';
import useConstant from 'use-constant';
import AwesomeDebouncePromise from 'awesome-debounce-promise';


const useStyles = makeStyles({
    root: {

    },
    maskedImage: {
        borderRadius: '50%',
        marginRight: 10,
    }
});

function Owner(props) {
    const intl = props.intl;
    const classes = useStyles();
    const [memberLoading, setMemberLoading] = useState(false);
    const [projectOwner, setProjectOwner] = useState({ 'name': '', 'email': '' });
    const [userSearchResults, setUserSearchResults] = useState([]);
    const [error, setError] = useState('');
    const lastUserSearchAbortController = useRef();

    const handleProjectOwnerChange = (event, value) => {
        setProjectOwner(value);
        setUserSearchResults([]);
        props.onProjectOwnerChange(event, value);
    };

    const loadUsers = (value) => {
        if (value.length <= 1) {
            return;
        }
        setMemberLoading(true);
        if (lastUserSearchAbortController.current) {
            lastUserSearchAbortController.current.abort();
        }
        const currentUserSearchAbortController = new AbortController();
        lastUserSearchAbortController.current = currentUserSearchAbortController;

        let usersResults = fetch(props.apiEndpointUsers + '/v1/users/?filterContains=' + encodeURIComponent(value),
            {
                signal: currentUserSearchAbortController.signal
            })
            .then((res) => {
                if (currentUserSearchAbortController.signal.aborted) {
                    throw new Error('Cancelled');
                }
                if (res.status === 500) {
                    setError('Error ' + res.status + ' from backend for user search: ' + res.url);
                    throw new Error(res.url);
                }
                return res.json()
            })
            .catch(console.error);
        Promise.all([usersResults]).then(([users]) => {
            setUserSearchResults(typeof users == 'object' ? users : []);
            setMemberLoading(false);
        });
    };

    const debouncedLoadUsers = useConstant(() =>
        AwesomeDebouncePromise(loadUsers, 300)
    );

    if (props.projectOwner.email !== '' &&
        projectOwner !== null &&
        projectOwner.email === '') {
        setProjectOwner(props.projectOwner);
    }

    return (<FormControl>
        <Autocomplete
            id={`set-project-owner`}
            key={`set-project-owner`}
            aria-describedby="project-owner-help"
            onChange={handleProjectOwnerChange}
            options={[props.projectOwner, ...userSearchResults]}
            filterOptions={(options) =>
                options.filter((option) => option !== "")
            }
            noOptionsText={intl.formatMessage({ id: "projectSetOwnerHelp" })}
            getOptionLabel={(option) => option.name}
            getOptionSelected={(a, b) => a.email === b.email}
            style={{ width: 300 }}
            clearOnBlur
            autoSelect={true}
            loading={memberLoading}
            defaultValue={props.projectOwner}
            value={projectOwner}
            onInputChange={(event, value, reason: string) => {
                if (reason === 'input') {
                    debouncedLoadUsers(value);
                }
            }}
            renderInput={(params) => <TextField {...params} fullWidth label={intl.formatMessage({ id: "projectOwnerHelp" })} error={props.hasErrors('project.owner')} helperText={props.getErrorHelp('project.owner')} variant="outlined" />}
            renderOption={(option) => {
                let icon = <PersonIcon className={classes.autocompleteIcon} />;
                if (option === null) {
                    return;
                }
                return (
                    <Grid container alignItems="center">
                        <Grid item>
                            {option.photo ? (
                                <img width="40" height="40" alt={option.name} className={classes.maskedImage} src={`data:image/jpeg;base64,${option.photo.replace(/_/g, '/').replace(/-/g, '+').replace(/\*/, '=').replace(/\./, '=')}`} />
                            ) : icon
                            }
                        </Grid>
                        <Grid item xs>
                            {option.name}

                            <Typography variant="body2" color="textSecondary">
                                {option.title}
                            </Typography>
                        </Grid>
                    </Grid>
                );
            }}
        />
        <FormHelperText id="project-owner-help">{intl.formatMessage({ id: "projectOwnerHelp" })}</FormHelperText>
        <Snackbar open={error !== ''} autoHideDuration={6000} onClose={() => { setError(''); }}>
            <MuiAlert elevation={6} variant="filled" onClose={() => { setError(''); }} severity="error">
                {error}
            </MuiAlert>
        </Snackbar>
    </FormControl>
    );
}
export default injectIntl(Owner);