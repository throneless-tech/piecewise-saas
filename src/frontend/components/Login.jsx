// base imports
import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import PropTypes from 'prop-types';

// material ui imports
import Avatar from '@material-ui/core/Avatar';
import Button from '@material-ui/core/Button';
import Checkbox from '@material-ui/core/Checkbox';
import Container from '@material-ui/core/Container';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';

// icons imports
import LockOutlinedIcon from '@material-ui/icons/LockOutlined';

export default function Login(props) {
  const history = useHistory();
  const { onAuthUpdate } = props;
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  const [helperText, setHelperText] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (username.trim() && password.trim()) {
      setIsButtonDisabled(false);
    } else {
      setIsButtonDisabled(true);
    }
  }, [username, password]);

  const handleKeyPress = e => {
    if (e.keyCode === 13 || e.which === 13) {
      isButtonDisabled || handleLogin();
    }
  };

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

  const handleLogin = async () => {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    formData.append('remember', remember);

    console.log('form data: ', formData);

    // const json = JSON.stringify({
    //   data: {
    //     username: username,
    //     password: password,
    //     remember: remember,
    //   },
    // });
    //
    // console.log('json: ', json);

    console.log('props.location.search: ', props.location.search);
    const params = new URLSearchParams(props.location.search);
    const isOauth =
      params.has('client_id') &&
      params.has('redirect_uri') &&
      params.has('response_type');

    const results = await fetch('/api/v1/login' + props.location.search, {
      method: 'POST',
      body: formData,
    })
      .then(res => {
        console.log('*** RESPONSE ***:', res);
        if (res.status === 200) {
          return res.json();
        } else {
          throw new Error('Failed to login.');
        }
      })
      .catch(error => {
        setError(true);
        setHelperText('Could not connect to authentication server.');
        console.error('error: ', error);
      });

    if (results.success && isOauth) {
      const auth = await fetch('/oauth2/authorize' + props.location.search)
        .then(res => {
          if (res.status === 200) {
            return res.json();
          } else {
            throw new Error('Failed to login.');
          }
        })
        .catch(error => {
          setError(true);
          setHelperText('Could not authorize oauth2 request.');
          console.error('error: ', error);
        });
      console.log('*** AUTH RESPONSE ***:', auth);
      if (auth.data[0].authorizationCode) {
        window.location.href =
          auth.data[0].redirectUri + '?code=' + auth.data[0].authorizationCode;
        return;
        //return history.push({
        //  pathname: params.get('redirect_uri'),
        //  state: { code: auth.data[0] },
        //});
      } else {
        setError(true);
        setHelperText('Invalid authorization code.');
        console.error('error: ', error);
        return;
      }
    } else if (results.success && results.user.role === 1) {
      setError(false);
      onAuthUpdate(true);
      setHelperText('Login successful.');
      return history.push({
        pathname: '/dashboard',
        state: { user: results.user },
      });
    } else {
      setError(true);
      setHelperText('Incorrect username or password.');
      return;
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <div>
        <Avatar>
          <LockOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          Sign in
        </Typography>
        <form noValidate>
          <TextField
            error={error}
            variant="outlined"
            margin="normal"
            required
            fullWidth
            id="username"
            value={username}
            label="Username"
            autoComplete="username"
            onChange={e => setUsername(e.target.value)}
            onKeyPress={e => handleKeyPress(e)}
            autoFocus
          />
          <TextField
            error={error}
            helperText={helperText}
            variant="outlined"
            margin="normal"
            required
            fullWidth
            label="Password"
            type="password"
            id="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyPress={e => handleKeyPress(e)}
            autoComplete="current-password"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={remember}
                color="primary"
                onChange={e => setRemember(e.target.checked)}
              />
            }
            label="Remember me"
          />
          <Button
            onClick={() => handleLogin()}
            disabled={isButtonDisabled}
            fullWidth
            variant="contained"
            color="primary"
          >
            Sign In
          </Button>
        </form>
      </div>
    </Container>
  );
}

Login.propTypes = {
  onAuthUpdate: PropTypes.func.isRequired,
  location: PropTypes.shape({
    search: PropTypes.string,
  }),
};
