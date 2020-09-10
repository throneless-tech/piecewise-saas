// base imports
import React, { Suspense } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import { lighten, makeStyles } from '@material-ui/core/styles';
// import { useHistory } from 'react-router-dom';

// material ui imports
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TablePagination from '@material-ui/core/TablePagination';
import TableRow from '@material-ui/core/TableRow';
import TableSortLabel from '@material-ui/core/TableSortLabel';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';

// modules imports
import AddInstance from '../utils/AddInstance.jsx';
import Loading from '../Loading.jsx';
import ViewInstance from '../utils/ViewInstance.jsx';

function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

function stableSort(array, comparator) {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilizedThis.map(el => el[0]);
}

const headCells = [
  // { id: 'id', numeric: true, disablePadding: true, label: 'ID' },
  {
    id: 'name',
    numeric: false,
    disablePadding: true,
    label: 'Name',
  },
  {
    id: 'domain',
    numeric: false,
    disablePadding: false,
    label: 'Domain',
  },
];

function EnhancedTableHead(props) {
  const { classes, order, orderBy, rowCount, onRequestSort } = props;
  const createSortHandler = property => event => {
    onRequestSort(event, property);
  };

  return (
    <TableHead>
      <TableRow>
        {headCells.map(headCell => (
          <TableCell
            key={headCell.id}
            padding={headCell.disablePadding ? 'none' : 'default'}
            sortDirection={orderBy === headCell.id ? order : false}
          >
            <TableSortLabel
              active={orderBy === headCell.id}
              direction={orderBy === headCell.id ? order : 'asc'}
              onClick={createSortHandler(headCell.id)}
            >
              {headCell.label}
              {orderBy === headCell.id ? (
                <span className={classes.visuallyHidden}>
                  {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                </span>
              ) : null}
            </TableSortLabel>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

EnhancedTableHead.propTypes = {
  classes: PropTypes.object.isRequired,
  onRequestSort: PropTypes.func.isRequired,
  order: PropTypes.oneOf(['asc', 'desc']).isRequired,
  orderBy: PropTypes.string.isRequired,
  rowCount: PropTypes.number.isRequired,
};

const useToolbarStyles = makeStyles(theme => ({
  root: {
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(1),
  },
  highlight:
    theme.palette.type === 'light'
      ? {
          color: theme.palette.secondary.main,
          backgroundColor: lighten(theme.palette.secondary.light, 0.85),
        }
      : {
          color: theme.palette.text.primary,
          backgroundColor: theme.palette.secondary.dark,
        },
  title: {
    flex: '1 1 100%',
  },
}));

const EnhancedTableToolbar = props => {
  const classes = useToolbarStyles();
  const { userRole, updateRows } = props;

  // handle add instance
  const [open, setOpen] = React.useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = (instance, id) => {
    if (instance) {
      instance.id = id;
      updateRows(instance);
    }
    setOpen(false);
  };

  if (userRole === 'admins') {
    return (
      <Toolbar className={clsx(classes.root)}>
        <Grid container spacing={2} alignItems="center" justify="flex-start">
          <Grid item>
            <Typography component="h2" variant="h3">
              Instances
            </Typography>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              disableElevation
              color="primary"
              onClick={handleClickOpen}
            >
              Add
            </Button>
            <AddInstance open={open} onClose={handleClose} />
          </Grid>
        </Grid>
      </Toolbar>
    );
  } else {
    return (
      <Toolbar className={clsx(classes.root)}>
        <Typography component="h2" variant="h3">
          Instances
        </Typography>
      </Toolbar>
    );
  }
};

EnhancedTableToolbar.propTypes = {
  updateRows: PropTypes.func.isRequired,
  instance: PropTypes.object,
};

const useStyles = makeStyles(theme => ({
  root: {
    marginBottom: theme.spacing(2),
    width: '100%',
  },
  table: {
    minWidth: 750,
  },
  visuallyHidden: {
    border: 0,
    clip: 'rect(0 0 0 0)',
    height: 1,
    margin: -1,
    overflow: 'hidden',
    padding: 0,
    position: 'absolute',
    top: 20,
    width: 1,
  },
}));

export default function EnhancedTable(props) {
  // const history = useHistory();
  const classes = useStyles();
  const { user, instance } = props;

  const [order, setOrder] = React.useState('asc');
  const [orderBy, setOrderBy] = React.useState('date');
  const [page, setPage] = React.useState(0);
  const rowsPerPage = 10;

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // handle pagination changes
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  let emptyRows;

  // handle view instance
  const [open, setOpen] = React.useState(false);
  const [index, setIndex] = React.useState(0);

  const handleClickOpen = index => {
    setIndex(index);
    setOpen(true);
  };

  const handleClose = (instance, index) => {
    if (instance) {
      let editedInstances = [...rows];
      editedInstances[index] = instance;
      setRows(editedInstances);
    }
    setOpen(false);
  };

  const handleCloseDelete = instanceToDeleteId => {
    let editedInstances = rows.filter(
      instance => instance.id !== Number(instanceToDeleteId),
    );
    setRows(editedInstances);
    setOpen(false);
  };

  const addData = row => {
    const newRow = [...rows, row];
    setRows(newRow);
  };

  // fetch api data
  const [error, setError] = React.useState(null);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [rows, setRows] = React.useState([]);
  // const [users, setUsers] = React.useState([]);

  const processError = res => {
    let errorString;
    if (res.statusCode && res.error && res.message) {
      errorString = `HTTP ${res.statusCode} ${res.error}: ${res.message}`;
    } else if (res.statusCode && res.status) {
      errorString = `HTTP ${res.statusCode}: ${res.status}`;
    } else {
      errorString = 'Error in response from server.';
    }
    return errorString;
  };

  React.useEffect(() => {
    let status;

    fetch('/api/v1/instances')
      .then(res => {
        status = res.status;
        return res.json();
      })
      .then(instances => {
        if (status === 200) {
          setRows(instances.data);
          emptyRows =
            rowsPerPage -
            Math.min(rowsPerPage, rows.length - page * rowsPerPage);
          setIsLoaded(true);
          return;
        } else {
          processError(instances);
          throw new Error(`Error in response from server.`);
        }
      })
      .catch(error => {
        setError(error);
        console.error(error.name + error.message);
        setIsLoaded(true);
      });
  }, []);

  if (error) {
    return <div>Error: {error.message}</div>;
  } else if (!isLoaded) {
    return <Loading />;
  } else {
    return (
      <Suspense fallback={<Loading />}>
        <div className={classes.root}>
          <EnhancedTableToolbar
            updateRows={addData}
            instance={instance}
            userRole={user.role_name}
          />
          <TableContainer>
            <Table
              className={classes.table}
              aria-labelledby="tableTitle"
              aria-label="enhanced table"
            >
              <EnhancedTableHead
                classes={classes}
                order={order}
                orderBy={orderBy}
                onRequestSort={handleRequestSort}
                rowCount={rows.length}
              />
              <TableBody>
                {stableSort(rows, getComparator(order, orderBy))
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((row, index) => {
                    const labelId = `data-row-${index}`;

                    if (row && row.id) {
                      return (
                        <TableRow
                          hover
                          onClick={() => {
                            handleClickOpen(index);
                          }}
                          key={row.id}
                        >
                          <TableCell
                            component="th"
                            id={labelId}
                            scope="row"
                            padding="none"
                          >
                            {row.name}
                          </TableCell>
                          <TableCell>{row.domain}</TableCell>
                        </TableRow>
                      );
                    }
                  })}
                {emptyRows > 0 && (
                  <TableRow style={{ height: emptyRows }}>
                    <TableCell colSpan={6} />
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={rows.length}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[rowsPerPage]}
            page={page}
            onChangePage={handleChangePage}
          />
          {rows.length > 0 && (
            <ViewInstance
              index={index + page * rowsPerPage}
              rows={stableSort(rows, getComparator(order, orderBy))}
              open={open}
              onClose={handleClose}
              onCloseDelete={handleCloseDelete}
              user={user}
            />
          )}
        </div>
      </Suspense>
    );
  }
}
