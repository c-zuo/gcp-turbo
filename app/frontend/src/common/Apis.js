import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import { injectIntl } from 'react-intl';

import Accordion from '@material-ui/core/Accordion';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

import Grid from '@material-ui/core/Grid';


import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';

import Avatar from '@material-ui/core/Avatar';
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';

import Input from '@material-ui/core/Input';
import TextField from '@material-ui/core/TextField';
import Autocomplete from '@material-ui/lab/Autocomplete';

import CheckCircleOutlineTwoToneIcon from '@material-ui/icons/CheckCircleOutlineTwoTone';
import CheckCircleTwoToneIcon from '@material-ui/icons/CheckCircleTwoTone';

const styles = theme => ({
    root: {
        width: '100%',
        marginTop: 4,
    },
    heading: {
        fontSize: theme.typography.pxToRem(15),
        flexBasis: '33.33%',
        flexShrink: 0,
    },
    secondaryHeading: {
        fontSize: theme.typography.pxToRem(15),
        color: theme.palette.text.secondary,
    },
    approvedApiIcon: {
        marginRight: 5,
        fill: "green"
    },
    holdApprovalApiIcon: {
        marginRight: 5,
        fill: "goldenrod"
    },
    autocompleteIcon: {
        marginRight: 5
    }
});

class Apis extends React.Component {
    state = {
        expanded: null,
        keyCount: 0,
        apis: [
        ],
        searchResults: [],
    };

    handleChange = panel => (event, expanded) => {
        this.setState({
            expanded: expanded ? panel : false,
        });
    };

    renderApis(prefix) {
        const intl = this.props.intl;
        const { classes } = this.props;

        const handleAddApis = (event, value) => {
            this.setState((state) => {
                let valueExists = false;
                state.apis.forEach((m, i) => {
                    if (m.api === value.api) {
                        valueExists = true;
                    }
                });
                if (!valueExists) {
                    state.apis.push(value);
                }
                this.props.onChangeApis(state.apis);
                return {
                    'apis': state.apis,
                    'keyCount': state.keyCount + 1,
                };
            });
        };

        const handleRemoveApis = (id) => {
            this.setState((state) => {
                state.apis = state.apis.filter(function (m) {
                    if (m.id !== id) {
                        return m;
                    }
                    return null;
                });
                this.props.onChangeApis(state.apis);
                return { 'apis': state.apis };
            });
        };

        const loadApisWithPrefix = (value) => {
            fetch(this.props.apiEndpoint + '/v1/apis/' + (value.length > 1 ? '?filterPrefix=' + encodeURIComponent(value) : ''))
                .then(res => res.json())
                .then((data) => {
                    this.setState({
                        'searchResults': data,
                    });
                })
                .catch(console.log)
        };

        return (
            <List className={classes.root}>
                {this.state.apis.map((m, i) => (
                    <ListItem key={`${prefix}-${m.api}`}>
                        <ListItemAvatar>
                            <Avatar title={m.preApproved ? intl.formatMessage({ id: "approvedApi" }) : intl.formatMessage({ id: "holdForApprovalApi" })}>
                                {m.preApproved ? <CheckCircleOutlineTwoToneIcon style={{ marginRight: 0 }} className={classes.approvedApiIcon} /> : <CheckCircleTwoToneIcon style={{ marginRight: 0 }} className={classes.holdApprovalApiIcon} />}
                            </Avatar>
                        </ListItemAvatar>
                        <Input type="hidden" name={`apis[]`} value={m.api} />
                        <ListItemText primary={m.title} secondary={m.description} />
                        <ListItemSecondaryAction>
                            <IconButton edge="end" aria-label="delete" onClick={() => handleRemoveApis(m.id)}>
                                <DeleteIcon />
                            </IconButton>
                        </ListItemSecondaryAction>
                    </ListItem>)
                )}
                <ListItem key={`${prefix}-add-api`} >
                    <Autocomplete
                        id={`${prefix}-add-new-item`}
                        key={`${prefix}-add-new-item-${this.state.keyCount}`}
                        onChange={handleAddApis}
                        options={this.state.searchResults}
                        getOptionLabel={(option) => option.title}
                        clearOnBlur
                        fullWidth
                        noOptionsText={intl.formatMessage({ id: "projectApisAddHelp" })}
                        onInputChange={(event, value, reason: string) => {
                            if (reason === 'input') {
                                loadApisWithPrefix(value);
                            }
                        }}
                        renderInput={(params) => <TextField {...params} fullWidth label={intl.formatMessage({ id: "projectApisAdd" })} variant="outlined" />}
                        renderOption={(option) => {
                            return (
                                <Grid container alignItems="center">
                                    <Grid item>
                                        {option.preApproved ? <CheckCircleOutlineTwoToneIcon className={classes.approvedApiIcon} /> : <CheckCircleTwoToneIcon className={classes.holdApprovalApiIcon} />}
                                    </Grid>
                                    <Grid item xs>
                                        {option.title}

                                        <Typography variant="caption" color="textSecondary" title={option.api} display="block">
                                            {option.api}
                                        </Typography>

                                        <Typography variant="body2" color="textSecondary" title={option.description}>
                                            {option.description.length > 60 ? option.description.substring(0, 60) + "…" : option.description}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            );
                        }}
                    />
                </ListItem>
            </List>
        );
    };

    render() {
        const intl = this.props.intl;
        const { classes } = this.props;
        const { expanded } = this.state;

        return (
            <div className={classes.root}>
                <Accordion expanded={expanded === 'additional-apis'} key={`additional-apis`} onChange={this.handleChange('additional-apis')} >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography className={classes.heading}>{intl.formatMessage({ id: "projectApis" })}</Typography>
                        <Typography className={classes.secondaryHeading}>{intl.formatMessage({ id: "projectApisHelp" })}</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        {this.renderApis('api')}
                    </AccordionDetails>
                </Accordion >
            </div >
        );
    }
}

Apis.propTypes = {
    classes: PropTypes.object.isRequired,
};

export default injectIntl(withStyles(styles)(Apis));