var path = require('path');
var webpack = require('webpack');

var ExtractTextPlugin = require('extract-text-webpack-plugin');

var isTest = (process.env.NODE_ENV == 'test' ? true : false);
var isWatch = (process.env.NODE_ENV == 'watch' ? true : false);
var isDev = (process.env.NODE_ENV == 'production' ? false : true);
var isProd = !isDev && !isTest;

var extractStylesCSS = new ExtractTextPlugin('styles'+ (isDev ? '' : '.min') +'.css', {allChunks: true, disable: false});

var pkg = require('./package.json');
var vendorPackages = Object.keys(pkg.dependencies);

/* entry */

var entry = {
    LazyCarousel: ['./src/index.js']
};

/* output */

var output = {
    chunkFilename: '[name].js',
    path: path.resolve('./dist'),
    publicPath: '/dist/',
    filename: '[name].js',
    library: '[name]',
    libraryTarget: 'umd'
};

if (isProd) {
    output.filename = '[name].min.js'
}

if (isTest) {
    delete output.library;
    delete output.libraryTarget;
}

/* preLoaders */

var preLoaders = [
    {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'eslint-loader'
    }
];

if (isWatch) {
    preLoaders = [];
}

if (isTest) {
    preLoaders = [];
}

/* loaders */

var loaders = [
    {
        test: /\.css$/,
        exclude: /(node_modules|bower_components)/,
        loader: extractStylesCSS.extract('style', 'css')
    },
    {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel',
        query: {
            presets: ["es2015", "stage-0"]
        }
    },
    {
        test:   /\.(png|jpg|svg|ttf|eot|woff|woff2)$/,
        loader: 'file?name=[path][name].[ext]'
    }
];

if (isTest) {
    loaders[0].loader = 'style!css';
}

/* plugins */

var plugins = [
    new webpack.NoErrorsPlugin(),
    extractStylesCSS
];

if (isDev) {
    plugins.push(new webpack.DefinePlugin({
        'process.env': {
            'NODE_ENV': JSON.stringify('development')
        }
    }));
}

if (isProd) {
    plugins.push(new webpack.DefinePlugin({
        'process.env': {
            'NODE_ENV': JSON.stringify('production')
        }
    }));
    plugins.push(new webpack.optimize.UglifyJsPlugin({
        minimize: true,
        sourceMap: true,
        compress: {
            warnings: false
        }
    }));
}

if (isTest) {
    plugins = [];
}

/* externals */

var externals = {
    'es6-promise': {
        root: "ES6Promise",
        commonjs2: 'es6-promise',
        commonjs: 'es6-promise',
        amd: 'es6-promise'
    },
    'my-utils': {
        root: "utils",
        commonjs2: 'my-utils',
        commonjs: 'my-utils',
        amd: 'my-utils'
    },
    angular: 'angular'
    //events: 'events'
};

if (isTest) {
    externals = {};
}

module.exports = {
	entry: entry,

	output: output,

    debug: isDev,
    devtool: isDev ? (isTest ? 'inline-source-map' : 'cheap-source-map') : false,

    resolve: {
        root: path.resolve(__dirname),
        modulesDirectories: ['node_modules'],
        extensions: ['', '.js', '.css'],
        alias: {
            tests: 'tests'
        }
    },

    resolveLoader: {
        modulesDirectories: ['node_modules'],
        moduleTemplates: ['*-loader', '*'],
        extensions: ['', '.js']
    },

	module: {
        preLoaders: preLoaders,
		loaders: loaders
	},

    plugins: plugins,

    devServer: {
        host: 'localhost',
        port: 3000,
        contentBase: './',
        publicPath: '/dist/',
        hot: true,
        watchOptions: {
            aggregateTimeout: 300,
            poll: 1000
        }
    },

    eslint: {
        failOnWarning: false,
        failOnError: true
    },

    externals: externals
};
