import React from 'react';
import { withStyles } from '@material-ui/styles';
import { injectIntl } from 'react-intl';

import Box from '@material-ui/core/Box';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import FormHelperText from '@material-ui/core/FormHelperText';
import FormLabel from '@material-ui/core/FormLabel';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import Autocomplete from '@material-ui/lab/Autocomplete';
import TextField from '@material-ui/core/TextField';

import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import ToggleButton from '@material-ui/lab/ToggleButton';
import ListItemText from '@material-ui/core/ListItemText';
import Skeleton from '@material-ui/lab/Skeleton';
import ClearIcon from '@material-ui/icons/Clear';
import IconButton from '@material-ui/core/IconButton';

import Team from './Team';
import Apis from './Apis';
import Advanced from './Advanced';
import Owner from './Owner';

const styles = (theme) => ({
    root: {
        flexGrow: 1,
    },
    projectFolderAndCode: {
        display: "flex",
        flexDirection: "row",
    },
    projectId: {
        marginLeft: 8,
    },
    projectName: {
        marginRight: 8,
    },
    projectGitlabProject: {
        marginTop: 8,
        display: "flex",
        flexDirection: "row",
    },
    projectGitlabProjectGroup: {
        width: "100%",
        minWidth: "300px"
    },
    projectIdName: {
        width: "100%",
        display: "flex",
        flexDirection: "row",
        marginTop: 8,
    },
    projectIapDescription: {
        display: "flex",
        flexDirection: "row",
        marginTop: 8,
    },
    projectDescription: {
        marginRight: 8,
    },
    projectIap: {
        marginLeft: 8,
    },
    projectOwner: {
    },
    projectTeam: {
    },
    projectSettings: {
        display: "flex",
        flexDirection: "row",
        marginTop: 8,
        paddingTop: 8
    },
    projectEnvironments: {
        marginTop: 4,
    },
    environmentToggle: {
        '&.Mui-selected': {
            backgroundColor: '#3f51b5',
            color: 'white'
        }
    },
    projectAdvancedSettings: {

    },
    maskedImage: {
        borderRadius: '50%',
        marginRight: 10,
    },
    projectGitlabProjectInput: {
        marginTop: 20,
    }
});

class Project extends React.Component {
    state = {
        environments: [],
        teams: [],
        projectEnvironments: [],
        budget: {},
        projectOwner: { 'name': '', 'email': '' },
        initialProjectOwner: { 'name': '', 'email': '' },
        projectId: '',
        projectIdSetManually: false,
        projectName: '',
        projectDescription: '',
        projectFolder: '',
        projectChargingCode: null,
        projectGitlabId: '',
        projectGitlabIdSetManually: false,
        projectGitlabGroup: '0',
        projectIapTitle: '',
        projectLabels: {},
        projectTeams: {},
        projectApis: [],
        projectPublicServices: false,
        projectBudgets: {},
        folders: [],
        chargingCodes: [],
        gitlabGroups: [{
            id: '0',
            path: '\u200b',
            title: '\u200b',
            description: '',
        }],
        errors: this.props.errors,
        errorMessages: this.props.errorMessages,
        userSearchResults: [],
        usersLoading: false,
    };
    projectRequest = {};

    updateProjectRequest = (state) => {
        let project = {
            'status': 'active',
            'projectId': state.projectId,
            'displayName': state.projectName,
            'description': state.projectDescription,
            'folder': state.projectFolder,
            'environments': state.projectEnvironments,
        };

        if (state.projectIapTitle !== '') {
            project['iap'] = {
                'title': state.projectIapTitle
            };
        }
        if (typeof state.projectOwner === 'object' && state.projectOwner !== null && state.projectOwner.hasOwnProperty('email')) {
            let ownerId = state.projectOwner.email.replace(/@.*$/, '')
            project['owners'] = [ownerId];
        } else {
            project['owners'] = [];
        }

        if (typeof state.projectChargingCode === 'object' && state.projectChargingCode !== null && state.projectChargingCode.hasOwnProperty('id')) {
            project['chargingCode'] = state.projectChargingCode.id;
        }
        if (typeof state.projectChargingCode === 'string' && state.projectChargingCode !== '') {
            project['chargingCode'] = state.projectChargingCode;
        }

        let newTeam = {};
        Object.keys(this.state.projectTeams).map((team) => {
            newTeam[team] = this.state.projectTeams[team].map((member) => {
                return member.email.replace(/@.*$/, '')
            });
            return null;
        });
        project['team'] = newTeam;
        if (state.projectPublicServices === true) {
            project['allowPublicServices'] = true;
        }
        if (state.projectApis.length > 0) {
            let additionalApis = state.projectApis.map((api) => {
                return api.api;
            });
            project['additionalApis'] = additionalApis;
        }
        if (Object.keys(state.projectBudgets).length > 0) {
            project['budget'] = state.projectBudgets;
        }
        if (Object.keys(state.projectLabels).length > 0) {
            project['labels'] = state.projectLabels;
        }
        if (state.projectGitlabGroup !== '0' || state.projectGitlabId !== '') {
            let gitlabGroup = state.gitlabGroups.find(element => element.id === state.projectGitlabGroup);
            project['gitlab'] = {
                'group': gitlabGroup ? gitlabGroup.path : '',
                'project': state.projectGitlabId,
            };
        }
        return project;
    }

    componentDidUpdate() {
        this.props.onChange(this.updateProjectRequest(this.state));
    }

    componentDidMount() {
        fetch(this.props.apiEndpoints['info'] + '/v1/info/')
            .then(res => res.json())
            .then((data) => {
                fetch(this.props.apiEndpoints['users'] + '/v1/users/' + encodeURIComponent(data['user_id']))
                    .then(res => res.json())
                    .then((data) => {
                        this.setState({
                            'projectOwner': data,
                            'initialProjectOwner': data
                        });
                    })
                    .catch(console.log);
            })
            .catch(console.log)
        fetch(this.props.apiEndpoints['environments'] + '/v1/environments/')
            .then(res => res.json())
            .then((data) => {
                let budget = this.state.budget;
                data.forEach((e) => {
                    budget[e.id] = e.budget;
                });
                this.setState({
                    environments: data,
                    budget: budget
                });
            })
            .catch(console.log)
        fetch(this.props.apiEndpoints['teams'] + '/v1/teams/')
            .then(res => res.json())
            .then((data) => {
                this.setState({ teams: data });
            })
            .catch(console.log)
        fetch(this.props.apiEndpoints['repositories'] + '/v1/repositories/')
            .then(res => res.json())
            .then((data) => {
                this.setState({
                    gitlabGroups: [{
                        id: '0',
                        path: '\u200b',
                        title: '\u200b',
                        description: '',
                    }, ...data]
                });
            })
            .catch(console.log)
        fetch(this.props.apiEndpoints['folders'] + '/v1/folders/')
            .then(res => res.json())
            .then((data) => {
                let defaultFolder = '';
                data.forEach((folder) => {
                    if (folder.default) {
                        defaultFolder = folder.id;
                    }
                });
                this.setState({
                    projectFolder: defaultFolder,
                    folders: data
                });
            })
            .catch(console.log)
        fetch(this.props.apiEndpoints['chargingcodes'] + '/v1/chargingcodes/')
            .then(res => res.json())
            .then((data) => {
                this.setState({ chargingCodes: data });
            })
            .catch(console.log)
    }

    render() {
        const intl = this.props.intl;
        const { classes } = this.props;

        const handleUpdateTeams = (teams) => {
            this.setState({
                'projectTeams': teams
            });
        };

        const handleUpdateApis = (apis) => {
            this.setState({
                'projectApis': apis
            });
        };

        const handleUpdateAdvanced = (iapTitle, publicServices, budgets) => {
            this.setState({
                'projectIapTitle': iapTitle,
                'projectPublicServices': publicServices,
                'projectBudgets': budgets,
            });
        };

        const handleProjectOwnerChange = (event, value) => {
            this.setState({
                'projectOwner': value
            });
        };

        const handleProjectEnvironmentChange = (event, newValues) => {
            this.setState(() => {
                return { 'projectEnvironments': newValues };
            });
        };

        const handleNameChange = (event) => {
            this.setState({
                'projectName': event.target.value,
                'projectIapTitle': event.target.value
            });
            if (event.target.value !== '') {
                let newValue = event.target.value.toLowerCase().replace(/ /g, '-').replace(/--+/g, '-').replace(/[^a-z0-9-]/g, '').substring(0, 18);
                if (!this.state.projectIdSetManually) {
                    this.setState(() => {
                        return { 'projectId': newValue };
                    });
                }
                if (!this.state.projectGitlabIdSetManually) {
                    this.setState(() => {
                        return { 'projectGitlabId': newValue };
                    });
                }
            }
        };

        const handleProjectIdChange = (event) => {
            this.setState({
                'projectId': event.target.value
            });
            if (event.target.value === '') {
                this.setState(() => {
                    return { 'projectIdSetManually': false }
                });
            }
        };

        const handleProjectDescriptionChange = (event) => {
            this.setState({
                'projectDescription': event.target.value
            });
        };

        const handleProjectIdFocus = (event) => {
            this.setState(() => {
                return { 'projectIdSetManually': true }
            });
        };

        const handleProjectGitlabIdChange = (event) => {
            this.setState({
                'projectGitlabId': event.target.value
            });
            if (event.target.value === '') {
                this.setState(() => {
                    return { 'projectGitlabIdSetManually': false }
                });
            }
        };

        const handleProjectGitlabIdFocus = (event) => {
            this.setState(() => {
                return { 'projectGitlabIdSetManually': true }
            });
        };

        const handleProjectFolderChange = (event) => {
            this.setState(() => {
                return { 'projectFolder': event.target.value };
            });
        };

        const handleProjectGitlabGroupChange = (event) => {
            this.setState(() => {
                return { 'projectGitlabGroup': event.target.value };
            });
        };

        const handleProjectChargingCodeChange = (event, value) => {
            this.setState({
                'projectChargingCode': value
            });
        };

        const handleChargingCodeOptionLabel = (option) => {
            if (typeof option === 'object') {
                return option.title;
            }
            if (typeof option === 'number') {
                return this.state.chargingCodes[option].title;
            }
            return option + "";
        };

        const handleGitlabProjectClear = () => {
            this.setState({
                'projectGitlabId': '',
                'projectGitlabGroup': '0'
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

        const lineBreaker = (input) => {
            return input.split('\n').map((item, key) => {
                return (<span key={key}>{item}<br /></span>)
            });
        };

        return (
            <div className={classes.root} >
                <Box className={classes.projectOwner}>
                    <Owner
                        apiEndpointUsers={this.props.apiEndpoints['users']}
                        projectOwner={this.state.initialProjectOwner}
                        onProjectOwnerChange={handleProjectOwnerChange}
                        hasErrors={hasErrors}
                        getErrorHelp={getErrorHelp}></Owner>
                </Box>
                <Box className={classes.projectIdName}>
                    <Box className={classes.projectName}>
                        <FormControl error={this.state.projectName.length > 20 || this.state.projectName.match(/[^A-Za-z0-9-'" !]/)}>
                            <FormLabel htmlFor="project-name">{intl.formatMessage({ id: "projectName" })}</FormLabel>
                            <TextField
                                id="project-name"
                                aria-describedby="project-name-help"
                                onChange={handleNameChange}
                                required
                                autoComplete="off"
                                value={this.state.projectName}
                                error={hasErrors('project.displayName')}
                                helperText={getErrorHelp('project.displayName')}
                            />
                            <FormHelperText id="project-name-help">{lineBreaker(intl.formatMessage({ id: "projectNameHelp" }))}</FormHelperText>
                        </FormControl>
                    </Box>
                    <Box className={classes.projectId}>
                        <FormControl>
                            <FormLabel htmlFor="project-id">{intl.formatMessage({ id: "projectId" })}</FormLabel>
                            <TextField id="project-id"
                                aria-describedby="project-id-help"
                                autoComplete="off"
                                value={this.state.projectId}
                                required
                                onChange={handleProjectIdChange}
                                onFocus={handleProjectIdFocus}
                                error={hasErrors('project.projectId')}
                                helperText={getErrorHelp('project.projectId')}
                            />
                            <FormHelperText id="project-id-help">{lineBreaker(intl.formatMessage({ id: "projectIdHelp" }))}</FormHelperText>
                        </FormControl>
                    </Box>
                </Box>
                <Box className={classes.projectIapDescription}>
                    <Box className={classes.projectDescription}>
                        <FormControl>
                            <FormLabel htmlFor="project-description">{intl.formatMessage({ id: "projectDescription" })}</FormLabel>
                            <TextField id="project-description"
                                multiline
                                required
                                autoComplete="off"
                                value={this.state.projectDescription}
                                onChange={handleProjectDescriptionChange}
                                error={hasErrors('project.description')}
                                helperText={getErrorHelp('project.description')}
                            />
                            <FormHelperText id="project-description">{intl.formatMessage({ id: "projectDescriptionHelp" })}</FormHelperText>
                        </FormControl>
                    </Box>
                </Box>
                <Box className={classes.projectFolderAndCode} mt={2}>
                    <Box pr={1}>
                        <FormControl>
                            <InputLabel htmlFor="project-folder">{intl.formatMessage({ id: "projectFolder" })}</InputLabel>
                            <Select id="project-folder"
                                aria-describedby="project-folder-help"
                                required value={this.state.projectFolder}
                                onChange={handleProjectFolderChange}
                                error={hasErrors('project.folder')}
                            >
                                {this.state.folders.map((folder, i) => (
                                    <MenuItem value={folder.id} key={folder.id}>{folder.title}</MenuItem>
                                ))}
                            </Select>
                            <FormHelperText id="project-folder-help">{lineBreaker(intl.formatMessage({ id: "projectFolderHelp" }))}</FormHelperText>
                        </FormControl>
                    </Box>
                    <Box pl={1}>
                        <FormControl>
                            <Autocomplete
                                id="project-charging-code"
                                aria-describedby="project-charging-code-help"
                                options={this.state.chargingCodes.sort((a, b) => -b.group.localeCompare(a.group))}
                                groupBy={(option) => option.group}
                                getOptionLabel={handleChargingCodeOptionLabel}
                                value={this.state.projectChargingCode}
                                onChange={handleProjectChargingCodeChange}
                                style={{ width: 300 }}
                                freeSolo
                                clearOnBlur
                                required
                                renderInput={(params) => <TextField {...params}
                                    label={intl.formatMessage({ id: "projectChargingCode" })}
                                    variant="standard"
                                    error={hasErrors('project.chargingCode')}
                                    helperText={getErrorHelp('project.chargingCode')}

                                />}
                            />
                            <FormHelperText id="project-charging-code-help">{lineBreaker(intl.formatMessage({ id: "projectChargingCodeHelp" }))}</FormHelperText>
                        </FormControl>
                    </Box>
                </Box>
                <Box className={classes.projectGitlabProject}>
                    <Box mr={1}>
                        <FormControl className={classes.projectGitlabProjectGroup}>
                            <FormLabel htmlFor="project-gitlab-project-group">{intl.formatMessage({ id: "projectGitlabProjectGroup" })}</FormLabel>
                            <Select id="project-gitlab-project-group" aria-describedby="project-gitlab-project-help" value={this.state.projectGitlabGroup} error={hasErrors('project.gitlab.group')} onChange={handleProjectGitlabGroupChange}>
                                {this.state.gitlabGroups.map((group, i) => (
                                    <MenuItem value={group.id} key={group.id}>
                                        <ListItemText primary={group.title} secondary={group.description} />
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                    <Box ml={1}>
                        <FormControl>
                            <FormLabel htmlFor="project-gitlab-project">{intl.formatMessage({ id: "projectGitlabProject" })}</FormLabel>
                            <TextField id="project-gitlab-project"
                                className={classes.projectGitlabProjectInput}
                                aria-describedby="project-gitlab-project-help"
                                value={this.state.projectGitlabId}
                                autoComplete="off"
                                error={hasErrors('project.gitlab.project')}
                                helperText={getErrorHelp('project.gitlab.project')}
                                onChange={handleProjectGitlabIdChange}
                                onFocus={handleProjectGitlabIdFocus}
                                InputProps={{
                                    startAdornment: (
                                        <IconButton onClick={handleGitlabProjectClear} disabled={!this.state.projectGitlabId} style={{ order: 1 }}>
                                            <ClearIcon color="disabled" fontSize="small" />
                                        </IconButton>
                                    )
                                }}
                                InputAdornmentProps={{
                                    position: "end",
                                    style: { order: 2, marginLeft: 0 }
                                }}
                            />
                            <FormHelperText id="project-gitlab-project-help">{lineBreaker(intl.formatMessage({ id: "projectGitlabProjectHelp" }))}</FormHelperText>
                        </FormControl>
                    </Box>

                </Box>
                <Box className={classes.projectTeam} mt={2}>
                    <InputLabel htmlFor="project-team" >{intl.formatMessage({ id: "projectTeam" })}</InputLabel>
                    {this.state.teams.length !== 0 ?
                        (<Team id="project-team"
                            apiEndpointUsers={this.props.apiEndpoints['users']}
                            apiEndpointGroups={this.props.apiEndpoints['groups']}
                            teams={this.state.teams}
                            onUpdateTeams={handleUpdateTeams} />) :
                        (<Skeleton variant="rect" width="100%" height={118} />)
                    }
                </Box>
                <Box className={classes.projectSettings}>
                    <Box mr={4} width={500}>
                        {this.state.environments.length !== 0 ? (
                            <FormControl>
                                <FormLabel error={hasErrors('project.environments')} htmlFor="project-environments">{intl.formatMessage({ id: "projectEnvironments" })}</FormLabel>
                                <ToggleButtonGroup id="project-environments"
                                    className={classes.projectEnvironments}
                                    orientation="horizontal"
                                    value={this.state.projectEnvironments}
                                    required
                                    onChange={handleProjectEnvironmentChange}
                                    aria-label={intl.formatMessage({ id: "projectEnvironments" })}
                                    aria-describedby="project-environments-help"
                                >
                                    {this.state.environments.map((env, i) => (
                                        <ToggleButton className={classes.environmentToggle}
                                            key={`select-${env.id}`}
                                            selected={this.state.projectEnvironments.find(e => e === env.id) !== undefined}
                                            value={env.id}>
                                            {env.title}
                                        </ToggleButton>
                                    ))}
                                </ToggleButtonGroup>
                                <FormHelperText id="project-environments-help">{lineBreaker(intl.formatMessage({ id: "projectEnvironmentsHelp" }))}</FormHelperText>
                            </FormControl>
                        ) : (
                                <Skeleton variant="text" width={300} height={118} />
                            )}
                    </Box>
                </Box>
                <Box className={classes.projectApis} mt={2}>
                    <Apis id="project-apis" apiEndpoint={this.props.apiEndpoints['apis']} onChangeApis={handleUpdateApis} />
                </Box>
                <Box className={classes.projectAdvancedSettings} mt={2}>
                    <Advanced id="project-advanced-settings"
                        apiEndpoint={this.props.apiEndpoints['apis']}
                        budget={this.state.budget}
                        iapTitle={this.state.projectIapTitle}
                        onChange={handleUpdateAdvanced}
                        errors={this.props.errors}
                        errorMessages={this.props.errorMessages}
                        environments={this.state.environments} />
                </Box>
            </div >)
    }
}

export default injectIntl(withStyles(styles)(Project));
