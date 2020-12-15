import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import { injectIntl } from 'react-intl';

import Typography from '@material-ui/core/Typography';

import Card from '@material-ui/core/Card';
import CardActionArea from '@material-ui/core/CardActionArea';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';

import Button from '@material-ui/core/Button';
import Box from '@material-ui/core/Box';

const styles = theme => ({
    root: {
        width: '100%',
        marginTop: 4,
    },
    card: {
        width: '33%',
        marginRight: 16
    },
    cmsContent: {
        "& a": {
            color: theme.palette.primary.main,
            fontWeight: 'bold'
        }
    },
    cardBoxes: {
        display: "flex",
        flexDirection: "row",
    }
});

class Frontpage extends React.Component {
    state = {
    };

    render() {
        const { classes } = this.props;
        const intl = this.props.intl;

        const handleAddNewProject = (event) => {
            this.props.onAddNewProject();
        };

        return (
            <div className={classes.root}>
                <Typography variant="h4" component="h1">
                    {this.props.content.title}
                </Typography>
                <Typography className={classes.cmsContent} dangerouslySetInnerHTML={{ __html: this.props.content.content }}>
                </Typography>

                <Box className={classes.cardBoxes}>
                    <Card className={classes.card}>
                        <CardActionArea>
                            <CardContent>
                                <Typography gutterBottom variant="h5" component="h2">
                                    {intl.formatMessage({ id: "frontpageAddProjectTitle" })}
                                </Typography>
                                <Typography variant="body2" color="textSecondary" component="p">
                                    {intl.formatMessage({ id: "frontpageAddProjectContent" })}
                                </Typography>
                            </CardContent>
                        </CardActionArea>
                        <CardActions>
                            <Button size="small" color="primary" onClick={handleAddNewProject}>
                                {intl.formatMessage({ id: "frontpageAddProjectButton" })}
                            </Button>
                        </CardActions>
                    </Card>
                    {this.props.content && this.props.content.boxes ? this.props.content.boxes.map((box) => (
                        <Card className={classes.card}>
                            <CardActionArea>
                                <CardContent>
                                    <Typography gutterBottom variant="h5" component="h2">
                                        {box.title}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary" component="p">
                                        {box.content}
                                    </Typography>
                                </CardContent>
                            </CardActionArea>
                            <CardActions>
                                <Button size="small" color="primary" onClick={() => { window.location.href = box.link.href; }}>
                                    {box.link.title}
                                </Button>
                            </CardActions>
                        </Card>
                    )) : ''}
                </Box>
            </div>
        );
    }
}

Frontpage.propTypes = {
    classes: PropTypes.object.isRequired,
};

export default injectIntl(withStyles(styles)(Frontpage));