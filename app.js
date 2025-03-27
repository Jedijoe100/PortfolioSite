import e from 'express';
import path from 'path';
import logger from 'morgan';
import session from 'express-session';
import data from './scripts/get_data.js';
import index from './routes/index.js'
import projects from './routes/projects.js'
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import start_commandline from './scripts/command_line.js'
    
const __dirname = dirname(fileURLToPath(import.meta.url));

const app = e(), port = 4000;
let Routers = [
    {name: "", router: index},
    {name: "portfolio", router: index},
    {name: "projects", router: projects}
]

//start commandline
start_commandline();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(e.urlencoded({extended: false}))
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}))


app.use(logger('dev'));
app.use(e.json());
app.use(e.urlencoded({extended: false}));
app.use(e.static(path.join(__dirname, 'public')));

Routers.forEach(value => {
    app.use('/' + value.name, value.router)
})

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    res.redirect('/')
    //next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error', {"data": data, "error": err});
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})
