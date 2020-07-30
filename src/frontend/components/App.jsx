// base imports
import React from 'react';
import PropTypes from 'prop-types';
import { Switch, Route, Redirect, useHistory } from 'react-router-dom';
import { lazy, LazyBoundary } from 'react-imported-component';
import Cookies from 'js-cookie';
import { ErrorBoundary } from 'react-error-boundary';
import Error from './Error.jsx';

// material ui imports
import { makeStyles } from '@material-ui/core/styles';
import Container from '@material-ui/core/Container';

const useStyles = makeStyles(() => ({
  container: {
    padding: 0,
  },
}));

const Dashboard = lazy(() => import('./Dashboard.jsx'));
const Front = lazy(() => import('./Front.jsx'));
const Loading = lazy(() => import('./Loading.jsx'));
const Login = lazy(() => import('./Login.jsx'));

const PrivateRoute = ({
  component: Component,
  authed,
  user,
  instance,
  ...rest
}) => {
  const history = useHistory();
  const path = { ...rest };

  if (user) {
    if (user.role !== 1 && path.path === '/admin') {
      return (
        <Route
          {...rest}
          render={props => (
            <Dashboard {...props} user={user} instance={instance} />
          )}
        />
      );
    } else {
      return (
        <Route
          {...rest}
          render={props =>
            authed === true ? (
              <Component {...props} user={user} instance={instance} />
            ) : (
              history.push('/login')
            )
          }
        />
      );
    }
  } else {
    return (
      <Route
        {...rest}
        render={props =>
          authed === true ? (
            <Component {...props} user={user} instance={instance} />
          ) : (
            history.push('/login')
          )
        }
      />
    );
  }
};

PrivateRoute.propTypes = {
  component: PropTypes.func.isRequired,
  authed: PropTypes.bool,
  user: PropTypes.object,
};

export default function App() {
  const classes = useStyles();
  const [authenticated, setAuthenticated] = React.useState(false);
  const updateAuthed = authState => {
    setAuthenticated(authState);
  };
  const [user, setUser] = React.useState(null);
  const [instance, setInstance] = React.useState(null);
  const [error, setError] = React.useState(null);
  const [isLoaded, setIsLoaded] = React.useState(false);

  const processError = res => {
    let errorString;
    if (res.statusCode && res.error && res.message) {
      errorString = `HTTP ${res.statusCode} ${res.error}: ${res.message}`;
    } else if (res.statusCode && res.status) {
      errorString = `HTTP ${res.statusCode}: ${res.status}`;
    } else if (res.message) {
      errorString = res.message;
    } else {
      errorString = 'Error in response from server.';
    }
    return errorString;
  };

  // fetch api data
  React.useEffect(() => {
    let userStatus, instanceStatus;
    const username = Cookies.get('mv_user');
    if (username) {
      // TODO: Add separate case for admin
      fetch(`api/v1/users/${username}`)
        .then(usersResponse => {
          userStatus = usersResponse.status;
          return usersResponse.json();
        })
        .then(users => {
          if (userStatus === 200) {
            setUser(users.data[0]);
            setAuthenticated(true);
            return users.data[0];
          } else {
            const error = processError(users);
            throw new Error(error);
          }
        })
        .then(user => fetch(`/api/v1/instances?of_user=${user.id}`))
        .then(instancesResponse => {
          instanceStatus = instancesResponse.status;
          return instancesResponse.json();
        })
        .then(instances => {
          if (instanceStatus === 200) {
            setInstance(instances.data[0]);
            setIsLoaded(true);
            return instances.data[0];
          } else {
            const error = processError(instances);
            throw new Error(error);
          }
        })
        .catch(error => {
          setError(error);
          console.error(error.name + error.message);
          setIsLoaded(true);
        });
    } else {
      setAuthenticated(false);
      setIsLoaded(true);
    }
  }, [authenticated]);

  if (error) {
    return <div>Error: {error.message}</div>;
  } else if (!isLoaded) {
    return <Loading />;
  } else {
    return (
      <Container className={classes.container}>
        <ErrorBoundary FallbackComponent={Error}>
          <Switch>
            <LazyBoundary fallback={Loading}>
              <Route path="/" exact component={Front} />
              <Route
                path="/login"
                render={props => (
                  <Login {...props} onAuthUpdate={updateAuthed} />
                )}
              />
              <PrivateRoute
                authed={authenticated}
                path="/dashboard"
                component={Dashboard}
                user={user}
                instance={instance}
              />
            </LazyBoundary>
            <Redirect to="/" />
          </Switch>
        </ErrorBoundary>
      </Container>
    );
  }
}
