import React, { useState, useRef } from 'react';
import { injectIntl } from 'react-intl';
import { makeStyles } from '@material-ui/core/styles';
import ListItem from '@material-ui/core/ListItem';
import PersonIcon from '@material-ui/icons/Person';
import GroupIcon from '@material-ui/icons/Group';

import TextField from '@material-ui/core/TextField';
import Autocomplete from '@material-ui/lab/Autocomplete';

import Snackbar from '@material-ui/core/Snackbar';
import MuiAlert from '@material-ui/lab/Alert';

import Typography from '@material-ui/core/Typography';

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

function AddMember(props) {
    const team = props.team;
    const intl = props.intl;
    const classes = useStyles();
    const [memberLoading, setMemberLoading] = useState(false);
    const [userSearchResults, setUserSearchResults] = useState([]);
    const [groupSearchResults, setGroupSearchResults] = useState([]);
    const [error, setError] = useState('');
    const [keyCount, setKeyCount] = useState(0);
    const lastUserSearchAbortController = useRef();
    const lastGroupSearchAbortController = useRef();

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
            .catch((res) => {
                console.log('Exception from loading users, safe to ignore:', res);
            });

        if (lastGroupSearchAbortController.current) {
            lastGroupSearchAbortController.current.abort();
        }
        const currentGroupSearchAbortController = new AbortController();
        lastGroupSearchAbortController.current = currentGroupSearchAbortController;

        let groupsResults = fetch(props.apiEndpointGroups + '/v1/groups/?filterPrefix=' + encodeURIComponent(value))
            .then((res) => {
                if (currentGroupSearchAbortController.signal.aborted) {
                    throw new Error('Cancelled');
                }
                if (res.status === 500) {
                    setError('Error ' + res.status + ' from backend for group search: ' + res.url);
                    throw new Error(res.url);
                }
                return res.json()
            })
            .catch((res) => {
                console.log('Exception from loading groups, safe to ignore:', res);
            })
        Promise.all([usersResults, groupsResults]).then(([users, groups]) => {
            setUserSearchResults(typeof users == 'object' ? users : []);
            setGroupSearchResults(typeof groups === 'object' ? groups : []);
            setMemberLoading(false);
        });
    };

    const debouncedLoadUsers = useConstant(() =>
        AwesomeDebouncePromise(loadUsers, 300)
    );

    const createSearchResults = () => {
        let users = userSearchResults.map((user) => {
            user['grouping'] = intl.formatMessage({ 'id': 'users' })
            return user;
        });
        let groups = groupSearchResults.map((group) => {
            group['grouping'] = intl.formatMessage({ 'id': 'groups' })
            return group;
        });
        return users.concat(groups);
    };

    const handleAddUser = (event, value) => {
        setKeyCount(keyCount + 1);
        setUserSearchResults([]);
        setGroupSearchResults([]);
        return props.onAddUser(event, value);
    };


    return (<div className={classes.root}>
        <ListItem key={`add-user-${team}`}>

            <Autocomplete
                id={`add-team-member-${team}`}
                key={`add-user-${team}-${keyCount}`}
                onChange={handleAddUser}
                options={createSearchResults()}
                noOptionsText={intl.formatMessage({ id: "projectTeamAddMemberHelp" })}
                groupBy={(option) => option.grouping}
                getOptionLabel={(option) => option.name}
                style={{ width: 300 }}
                clearOnBlur
                autoSelect={true}
                loading={memberLoading}
                onInputChange={(event, value, reason: string) => {
                    if (reason === 'input') {
                        try {
                            debouncedLoadUsers(value);
                        } catch (err) {
                            console.log('Error from debounced user load, safe to ignore: ', err)
                        }
                    }
                }}
                renderInput={(params) => <TextField {...params} fullWidth label={intl.formatMessage({ id: "projectTeamAddMember" })} variant="outlined" />}
                renderOption={(option) => {
                    let icon = option.grouping === 'user' ? <PersonIcon className={classes.autocompleteIcon} /> : <GroupIcon className={classes.autocompleteIcon} />;
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
        </ListItem>
        <Snackbar open={error !== ''} autoHideDuration={6000} onClose={() => { setError(''); }}>
            <MuiAlert elevation={6} variant="filled" onClose={() => { setError(''); }} severity="error">
                {error}
            </MuiAlert>
        </Snackbar>
    </div>);
}
export default injectIntl(AddMember);