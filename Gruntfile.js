module.exports = function(grunt) {
	var os, ipAddress, reloadPort, serverPort, projectOptions;

	os=require('os');
	function lookupIpAddress() {
		var ifaces=os.networkInterfaces(), ip = null;
		for (var dev in ifaces) {
			if(dev != "en1" && dev != "en0") {
				continue;
			}
			ifaces[dev].forEach(function(details){
				if (details.family=='IPv4') {
					ip = details.address;
				}
			});
		}
		return ip;
	}
 	ipAddress = grunt.option('host') || lookupIpAddress();

	console.log(ipAddress);

 	reloadPort = 1123;
 	serverPort = 1337;

	projectOptions = {};
	projectOptions.cssPath = 'css';
	projectOptions.cssExpandedPath = 'css-expanded';
	projectOptions.jsPath = 'js-compressed';
	projectOptions.localCheck = false;

	projectOptions.sass = {
		minified: {
			options: {
				style: 'compressed',
				noCache: true
			},
			files: {}
		},
		expanded: {
			options: {
				style: 'expanded',
				noCache: true
			},
			files: {}
		}
	};
	projectOptions.sass.minified.files[projectOptions.cssPath + '/style.css'] = 'SASS/style.scss';
	projectOptions.sass.expanded.files[projectOptions.cssExpandedPath + '/style.css'] = 'SASS/style.scss';


	projectOptions.config = {
		pkg: grunt.file.readJSON('package.json'),
		sass: projectOptions.sass,

		requirejs:  {
			compile: {
				options: {
					baseUrl: './JS',
					paths: {
						requireLib: "lib/require",
						text: 'lib/text',
						jquery: 'lib/jquery-2.1.1.min'
					},
					map: {
					'*': { 'jquery': 'jquery-private' },
					'jquery-private': { 'jquery': 'jquery' }
					},
					name: "script",
					out: "./" + projectOptions.jsPath + "/script.js",
					include: ["requireLib"]
				}
			},

			compileIE: {
				options: {
					baseUrl: './JS',
					paths: {
						requireLib: "lib/require",
						text: 'lib/text',
						jquery: 'lib/jquery-1.11.1.min',
						matchMediaListener: 'lib/matchMedia.addListener',
						matchMedia: 'lib/matchMedia'
					},
					map: {
					'*': { 'jquery': 'jquery-private' },
					'jquery-private': { 'jquery': 'jquery' }
					},
					name: "script",
					out: "./" + projectOptions.jsPath + "/script-ie.js",
					include: ["requireLib", "matchMedia", "matchMediaListener"]
				}
			}
		},

		watch: {
			cssProd: {
				files: 'SASS/**/*.scss',
				tasks: ['sass']
			},
			scriptsProd: {
				files: ['JS/**/*'],
				tasks: ['requirejs']
			},
			cssDev: {
				files: 'SASS/**/*.scss',
				tasks: ['sass:minified']
			},
			scriptsDev: {
				files: ['JS/**/*'],
				tasks: ['requirejs:compile']
			},
			finalResources: {
				files: [projectOptions.jsPath + '/script.js', projectOptions.cssPath + '/style.css'],
				options: {
					livereload: reloadPort
				}
			}
		},
		concurrent: {
			options: {
				logConcurrentOutput: true,
				limit: 5
			},
			prod: {
				tasks: ['watch:cssProd', 'watch:scriptsProd']
			},
			dev: {
				tasks: ['watch:cssDev', 'watch:scriptsProd', 'watch:finalResources']
			}
		},
		connect: {
			server: {
				options: {
					port: serverPort,
					base: './',
					middleware: function(connect, options, middlewares) {
						// inject a custom middleware into the array of default middlewares
						middlewares.unshift(function (req, res, next) {
							res.setHeader('Access-Control-Allow-Origin', '*');
							res.setHeader('Access-Control-Allow-Methods', '*');
							//a console.log('foo') here is helpful to see if it runs
							return next();
						});
						return middlewares;
					},
				},

			}
		}
	};


	// Sometimes CMS's like Sitefinity make working local difficult.
	// This option will expose a folder for us to load an image to
	// determine if we should be referencing local or server assets.

	if (projectOptions.localCheck) {
		projectOptions.config.connect.localCheck = {
			options: {
				port: 7445,
				base: './local-check/',
				middleware: function(connect, options, middlewares) {
					// inject a custom middleware into the array of default middlewares
					middlewares.unshift(function (req, res, next) {
						res.setHeader('Access-Control-Allow-Origin', '*');
						res.setHeader('Access-Control-Allow-Methods', '*');
						//a console.log('foo') here is helpful to see if it runs
						return next();
					});
					return middlewares;
				},
			}
		};
	}

	grunt.initConfig(projectOptions.config);

	grunt.loadNpmTasks('grunt-contrib-sass');
	grunt.loadNpmTasks('grunt-contrib-requirejs');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-connect');
	grunt.loadNpmTasks('grunt-concurrent');

	projectOptions.tasks = {
		default: ['sass', 'requirejs'],
		runSass: ['sass'],
		dev: ['connect:server', 'concurrent:dev'],
		prod: ['connect:server', 'concurrent:prod']
	}

	if (projectOptions.localCheck) {
		projectOptions.tasks.dev = ['connect:server', 'connect:devHack', 'concurrent:dev'];
	}

	for (var key in projectOptions.tasks) {
		grunt.registerTask(key, projectOptions.tasks[key]);
	}
}
