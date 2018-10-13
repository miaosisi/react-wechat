'use strict';

var gulp = require('gulp');
var initGulpTasks = require('react-component-gulp-tasks');

var taskConfig = {

	component: {
		name: 'react-wechat',
		file: 'index.js'
	}	

};

initGulpTasks(gulp, taskConfig);
