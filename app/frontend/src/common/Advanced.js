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
import Input from '@material-ui/core/Input';
import TextField from '@material-ui/core/TextField';

import Box from '@material-ui/core/Box';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormHelperText from '@material-ui/core/FormHelperText';
import FormLabel from '@material-ui/core/FormLabel';
import Skeleton from '@material-ui/lab/Skeleton';
import Switch from '@material-ui/core/Switch';

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
    autocompleteIcon: {
        marginRight: 5
    },
    advancedBox: {
        display: "flex",
        flexDirection: "row",
    },
    projectIapBox: {
        marginBottom: 10,
        borderColor: 'red'
    },
    budgetBox: {
        marginTop: 20,
    }
});

class Advanced extends React.Component {
    state = {
        expanded: null,
        keyCount: 0,
        searchResults: [],
        budget: {},
        originalBudget: {},
        environments: '',
        iapTitle: null,
        iapTitleSetManually: false,
        publicServices: false,
        errors: this.props.errors,
        errorMessages: this.props.errorMessages
    };

    handleChange = panel => (event, expanded) => {
        this.setState({
            expanded: expanded ? panel : false,
        });
    };

    static getDerivedStateFromProps(props, state) {
        if (Object.keys(state.budget).length === 0) {
            state.budget = props.budget;
        }
        if (Object.keys(state.originalBudget).length === 0) {
            state.originalBudget = Object.assign({}, props.budget);
        }
        if (state.environments.length === 0) {
            state.environments = props.environments;
        }
        if (!state.iapTitleSetManually) {
            state.iapTitle = props.iapTitle;
        }
        return state;
    }

    getFilteredBudgets(inputBudget) {
        let filteredBudgets = {};
        Object.keys(inputBudget).forEach((env, index) => {
            if (inputBudget[env] === this.state.originalBudget[env]) {
                return null;
            }
            filteredBudgets[env] = inputBudget[env];
        });
        return filteredBudgets;
    }

    render() {
        const intl = this.props.intl;
        const { classes } = this.props;
        const { expanded } = this.state;

        const handleBudgetInputChange = (env, event) => {
            const newValue = event.target.value;
            let newBudget = this.state.budget;
            newBudget[env] = newValue === '' ? 0 : Number(newValue);
            this.setState(() => {
                this.props.onChange(this.state.iapTitle, this.state.publicServices, this.getFilteredBudgets(newBudget));
                return { 'budget': newBudget }
            });

        };

        const handleIapTitleFocus = (env, event) => {
            this.setState({
                'iapTitleSetManually': true
            });
        };

        const handleIapInputChange = (event) => {
            let targetValue = event.target.value;
            this.setState(() => {
                this.props.onChange(targetValue, this.state.publicServices, this.getFilteredBudgets(this.state.budget));
                return { 'iapTitle': targetValue }
            });
        };

        const handlePublicServicesChange = (event) => {
            let targetChecked = event.target.checked;
            this.setState(() => {
                this.props.onChange(this.state.iapTitle, targetChecked, this.getFilteredBudgets(this.state.budget));
                return { 'publicServices': targetChecked }
            });
        };

        const hasErrors = (field) => {
            return this.props.errors.indexOf(field) !== -1;
        };

        const getErrorHelp = (field) => {
            if (this.props.errors.indexOf(field) === -1) {
                return '';
            }
            let message = this.props.errorMessages.find(element => element.field === field)
            if (message !== undefined) {
                return message['error'];
            }
            return '';
        };


        return (
            <div className={classes.root}>
                <Accordion expanded={expanded === 'advanced-settings'} key={`advanced-settings`} onChange={this.handleChange('advanced-settings')} >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography className={classes.heading}>{intl.formatMessage({ id: "projectAdvancedSettings" })}</Typography>
                        <Typography className={classes.secondaryHeading}>{intl.formatMessage({ id: "projectAdvancedSettingsHelp" })}</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Box className={classes.projectIapBox}>
                            <Box className={classes.projectIap}>
                                <FormControl>
                                    <FormLabel htmlFor="project-iap-title">{intl.formatMessage({ id: "projectIapTitle" })}</FormLabel>
                                    <TextField id="project-iap-title"
                                        value={this.state.iapTitle}
                                        onFocus={handleIapTitleFocus}
                                        onChange={handleIapInputChange}
                                        error={hasErrors('project.iap')}
                                        helperText={getErrorHelp('project.iap')}
                                    />
                                    <FormHelperText id="project-title">{intl.formatMessage({ id: "projectIapTitleHelp" })}</FormHelperText>
                                </FormControl>
                            </Box>
                            <Box>
                                <FormControl>
                                    <FormControlLabel pl={8}
                                        control={<Switch checked={this.state.publicServices} onChange={handlePublicServicesChange} />}
                                        label={intl.formatMessage({ id: "projectPublicServices" })}
                                    />
                                    <FormHelperText id="project-public-services-help">{intl.formatMessage({ id: "projectPublicServicesHelp" })}</FormHelperText>
                                </FormControl>
                            </Box>
                            <Box className={classes.budgetBox}>
                                <Box>
                                    <FormLabel htmlFor="project-budgets">{intl.formatMessage({ id: "projectBudgets" })}</FormLabel>
                                    {Object.keys(this.state.budget).length > 0 && this.state.environments.length > 0 ?
                                        this.state.environments.map((env, i) => (
                                            <Grid container spacing={2} alignItems="center" key={`budget-input-${env.id}`}>
                                                <Grid item xs>
                                                    {env.title}
                                                </Grid>
                                                <Grid item>
                                                    <Input
                                                        fullWidth
                                                        startAdornment="$"
                                                        value={this.state.budget[env.id]}
                                                        name={`budget[${env.id}]`}
                                                        onChange={(event) => handleBudgetInputChange(env.id, event)}
                                                        className={classes.input}
                                                        margin="dense"
                                                        inputProps={{
                                                            type: 'number',
                                                            'aria-labelledby': 'input-slider',
                                                        }}
                                                    />

                                                </Grid>
                                            </Grid>
                                        )) : (
                                            <Skeleton variant="text" width={300} height={118} />
                                        )
                                    }
                                </Box>
                            </Box>
                        </Box>

                    </AccordionDetails>
                </Accordion >
            </div >
        );
    }
}

Advanced.propTypes = {
    classes: PropTypes.object.isRequired,
};

export default injectIntl(withStyles(styles)(Advanced));