import React from 'react';
import './ProjectApp.css';

import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import { withStyles, makeStyles } from '@material-ui/styles';

import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';

import Paper from '@material-ui/core/Paper';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Project from './common/Project';
import Backdrop from '@material-ui/core/Backdrop';
import CircularProgress from '@material-ui/core/CircularProgress';
import Typography from '@material-ui/core/Typography';
import Snackbar from '@material-ui/core/Snackbar';
import MuiAlert from '@material-ui/lab/Alert';

import { injectIntl } from 'react-intl';

const styles = makeStyles((theme) => ({
  table: {
  },
  backdrop: {
    zIndex: 10000,
    color: '#fff',
  }
}));

class ProjectApp extends React.Component {
  state = {
    'showBackdrop': false,
    'addDialogOpen': false,
    'projectRequest': {},
    'projectRequestErrors': [],
    'projectRequestErrorMessages': [],
    'backendException': '',
  };


  render() {
    const intl = this.props.intl;
    const { classes } = this.props;
    const apiEndpoints = this.props.apiEndpoints;

    const lineBreaker = (input) => {
      return input.split('\n').map((item, key) => {
        return (<span key={key}>{item}<br /></span>)
      });
    };

    const handleOpenAddDialog = () => {
      fetch(apiEndpoints.apiEndpoints['projects'] + '/v1/projects/?dryRun=1',
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          method: 'POST',
          body: JSON.stringify(this.state.projectRequest)
        })
        .then(res => res.json())
        .then((data) => {
          if (data.ok) {
            this.setState({
              'addDialogOpen': true
            });
          } else {
            if (data.errors) {
              this.setState({
                'projectRequestErrors': Object.keys(data.errors),
                'projectRequestErrorMessages': Object.keys(data.errors).map((element) => {
                  return { 'field': element, 'error': data.errors[element].error };
                })
              });
            } else if (data.message) {
              this.setState({
                'backendException': data.message,
              });
            }
          }
        })
        .catch(console.log);
    };

    const handleCloseAddDialog = (event, reason) => {
      this.setState({
        'addDialogOpen': false
      });
    };

    const handleSubmitProjectRequest = (event, reason) => {
      this.setState({
        'addDialogOpen': false,
        'showBackdrop': true
      });
      fetch(apiEndpoints.apiEndpoints['projects'] + '/v1/projects/',
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          method: 'POST',
          body: JSON.stringify(this.state.projectRequest)
        })
        .then(res => res.json())
        .then((data) => {
          if (data.ok) {
            window.location.href = data.redirect_url;
          } else {
            if (data.errors) {
              this.setState({
                'showBackdrop': false,
                'projectRequestErrors': Object.keys(data.errors),
                'projectRequestErrorMessages': Object.keys(data.errors).map((element) => {
                  return { 'field': element, 'error': data.errors[element].error };
                })
              });
            } else if (data.message) {
              this.setState({
                'showBackdrop': false,
                'backendException': data.message,
              });
            }
          }
        })
        .catch(console.log);
    };

    const handleProjectUpdate = (project) => {
      this.state.projectRequest = project;
    };

    return (
      <Box>
        <Backdrop className={classes.backdrop} style={{ zIndex: 10000 }} open={this.state.showBackdrop}>
          <Typography variant="h6" component="h1">
            {intl.formatMessage({ id: "toGitlab" })}
          </Typography>
          <CircularProgress color="inherit" />
        </Backdrop>
        <Box m={2} maxWidth={900} id="project">
          <Project apiEndpoints={apiEndpoints.apiEndpoints} errors={this.state.projectRequestErrors} errorMessages={this.state.projectRequestErrorMessages} onChange={handleProjectUpdate}></Project>
          <Snackbar open={Object.keys(this.state.projectRequestErrors).length > 0} autoHideDuration={3000}>
            <MuiAlert elevation={6} variant="filled" severity="error">
              {intl.formatMessage({ id: "validationError" })}
            </MuiAlert>
          </Snackbar>
          <Snackbar open={this.state.backendException !== ''} autoHideDuration={3000}>
            <MuiAlert elevation={6} variant="filled" severity="error">
              {this.state.backendException}
            </MuiAlert>
          </Snackbar>

        </Box>
        <Box m={2}>
          <Button variant="contained" color="primary" onClick={handleOpenAddDialog} pt={2}>
            {intl.formatMessage({ id: "projectCreateButton" })}
          </Button>
          <Dialog
            open={this.state.addDialogOpen}
            onClose={handleCloseAddDialog}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
          >
            <DialogTitle id="alert-dialog-title">{intl.formatMessage({ id: "projectAddConfirmationTitle" })}</DialogTitle>
            <DialogContent>
              <DialogContentText id="alert-dialog-description">
                {intl.formatMessage({ id: "projectAddConfirmationText" })}
              </DialogContentText>
              <TableContainer component={Paper}>
                <Table className={classes.table} aria-label="simple table">
                  <TableHead>
                    <TableRow>
                      <TableCell>Setting</TableCell>
                      <TableCell>Value</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow key="project-owner">
                      <TableCell component="th" scope="row">
                        {intl.formatMessage({ id: "projectSummaryOwner" })}
                      </TableCell>
                      <TableCell>{this.state.projectRequest.owners}</TableCell>
                    </TableRow>
                    <TableRow key="project-name">
                      <TableCell component="th" scope="row">
                        {intl.formatMessage({ id: "projectSummaryName" })}
                      </TableCell>
                      <TableCell>{this.state.projectRequest.displayName}</TableCell>
                    </TableRow>
                    <TableRow key="project-id">
                      <TableCell component="th" scope="row">
                        {intl.formatMessage({ id: "projectSummaryId" })}
                      </TableCell>
                      <TableCell>{this.state.projectRequest.projectId}</TableCell>
                    </TableRow>
                    <TableRow key="project-environments">
                      <TableCell component="th" scope="row">
                        {intl.formatMessage({ id: "projectSummaryEnvironments" })}
                      </TableCell>
                      <TableCell>{this.state.projectRequest.environments ? this.state.projectRequest.environments.join(', ') : ''}</TableCell>
                    </TableRow>
                    <TableRow key="project-description">
                      <TableCell component="th" scope="row">
                        {intl.formatMessage({ id: "projectSummaryDescription" })}
                      </TableCell>
                      <TableCell>{this.state.projectRequest.description}</TableCell>
                    </TableRow>
                    <TableRow key="project-team">
                      <TableCell component="th" scope="row">
                        {intl.formatMessage({ id: "projectSummaryTeam" })}
                      </TableCell>
                      <TableCell>{this.state.projectRequest.team ? Object.keys(this.state.projectRequest.team).map((team) => {
                        return <span><span>{`${team}: `}</span><span>{this.state.projectRequest.team[team].join(', ')}<br /></span></span>;
                      }) : ``}</TableCell>
                    </TableRow>
                    <TableRow key="project-apis">
                      <TableCell component="th" scope="row">
                        {intl.formatMessage({ id: "projectSummaryAdditionalApis" })}
                      </TableCell>
                      <TableCell>{this.state.projectRequest.additionalApis}</TableCell>
                    </TableRow>
                    <TableRow key="project-publicservices">
                      <TableCell component="th" scope="row">
                        {intl.formatMessage({ id: "projectSummaryPublicServices" })}
                      </TableCell>
                      <TableCell>{this.state.projectRequest.allowPublicServices ? intl.formatMessage({ id: "projectSummaryAllowPublicServices" }) : `- `}</TableCell>
                    </TableRow>
                    <TableRow key="project-budgets">
                      <TableCell component="th" scope="row">
                        {intl.formatMessage({ id: "projectSummaryBudgets" })}
                      </TableCell>
                      <TableCell>{this.state.projectRequest.budget && Object.keys(this.state.projectRequest.budget).length > 0 ?
                        Object.keys(this.state.projectRequest.budget).map((env) => {
                          return lineBreaker(env + ": $" + this.state.projectRequest.budget[env] + "\n")
                        }) : intl.formatMessage({ id: "projectSummaryDefaultBudget" })}</TableCell>
                    </TableRow>
                    <TableRow key="project-iap">
                      <TableCell component="th" scope="row">
                        {intl.formatMessage({ id: "projectSummaryIapTitle" })}
                      </TableCell>
                      <TableCell>{this.state.projectRequest.iap ? this.state.projectRequest.iap.title : `- `}</TableCell>
                    </TableRow>
                    <TableRow key="project-gitlab">
                      <TableCell component="th" scope="row">
                        {intl.formatMessage({ id: "projectSummaryGitlab" })}
                      </TableCell>
                      <TableCell>{this.state.projectRequest.gitlab ? `${this.state.projectRequest.gitlab.group} / ${this.state.projectRequest.gitlab.project}` : ``}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseAddDialog} color="primary">
                {intl.formatMessage({ id: "projectAddConfirmationCancel" })}
              </Button>
              <Button onClick={handleSubmitProjectRequest} color="primary" autoFocus>
                {intl.formatMessage({ id: "projectAddConfirmationCreate" })}
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Box >
    );
  }
}

export default injectIntl(withStyles(styles)(ProjectApp));
