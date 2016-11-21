const pkg = require('./package.json');

const fs = require('fs');
const path = require('path');

const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const OpenBrowserPlugin = require('open-browser-webpack-plugin');
const SassLintPlugin = require('sasslint-webpack-plugin');
const UnminifiedWebpackPlugin = require('unminified-webpack-plugin');

const archiver = require('archiver');

const extractSrc = new ExtractTextPlugin('dist/vizabi.css');
const extractPreview = new ExtractTextPlugin('preview/assets/css/main.css');

const __PROD__ = process.env.NODE_ENV === 'production';
const timestamp = new Date();

const sep = '\\' + path.sep;
const stats = {
  colors: true,
  hash: false,
  version: false,
  timings: true,
  assets: false,
  chunks: false,
  modules: false,
  reasons: true,
  children: false,
  source: false,
  errors: true,
  errorDetails: true,
  warnings: false,
  publicPath: false
};

function AfterBuildPlugin(callback) {
  this.callback = callback;
}
AfterBuildPlugin.prototype.apply = function (compiler) {
  compiler.plugin('done', this.callback);
};

const plugins = [
  new CleanWebpackPlugin(['build']),
  extractSrc,
  extractPreview,
  new CopyWebpackPlugin([
    {
      from: '.data/',
      to: 'preview/data/'
    },
    {
      from: 'preview/assets/js/',
      to: 'preview/assets/js/'
    },
    {
      from: 'src/assets/translation/',
      to: 'preview/assets/translation/'
    }
  ]),
  new CopyWebpackPlugin([
    {
      from: 'src/assets/translation/',
      to: 'dist/assets/translation/'
    }
  ]),
  new OpenBrowserPlugin({
    url: 'http://localhost:8080/preview/'
  }),
  new SassLintPlugin({
    quiet: false,
    syntax: 'scss',
    glob: 'src/**/*.s?(a|c)ss',
    ignorePlugins: ['extract-text-webpack-plugin']
  }),
  new webpack.DefinePlugin({
    __VERSION: JSON.stringify(pkg.version),
    __BUILD: +timestamp
  })
];

if (__PROD__) {
  plugins.push(
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.UglifyJsPlugin({
      sourceMap: true,
      compressor: {
        screw_ie8: true,
        warnings: false
      },
      mangle: {
        screw_ie8: true
      },
      output: {
        comments: false,
        screw_ie8: true
      }
    }),
    new UnminifiedWebpackPlugin(),
    new AfterBuildPlugin(() => {
      fs.mkdirSync(path.resolve(__dirname, 'build', 'download'));

      const archive = archiver('zip');
      const files = [
        'vizabi.css',
        'vizabi.min.js',
        'vizabi.js'
      ];

      files.forEach(name =>
        archive.append(
          fs.createReadStream(path.resolve('build', 'dist', name)),
          { name }
        )
      );

      archive.pipe(
        fs.createWriteStream(path.resolve('build', 'download', 'vizabi.zip'))
      );
      archive.glob("**/*", { cwd: 'src/assets/cursors', dot: true }, { prefix: 'assets/cursors' });
      archive.glob("en.json", { cwd: 'src/assets/translation', dot: true }, { prefix: 'assets/translation' });
      archive.finalize();
    }),
    new webpack.BannerPlugin({
      banner: [
        '/**',
        ' * ' + pkg.name + ' - ' + pkg.description,
        ' * @version v' + pkg.version,
        ' * @build timestamp ' + timestamp,
        ' * @link ' + pkg.homepage,
        ' * @license ' + pkg.license,
        ' */',
        ''
      ].join('\n'),
      raw: true
    })
  )
}

module.exports = {
  devtool: 'source-map',

  entry: {
    'dist/vizabi': './src/vizabi-gapminder',
    'preview': './preview/index'
  },

  output: {
    path: path.resolve(__dirname, 'build'),
    filename: __PROD__ ? '[name].min.js' : '[name].js',
    library: 'Vizabi',
    libraryTarget: 'umd',
    umdNamedDefine: true
  },

  resolve: {
    modules: [
      path.resolve(__dirname, 'src'),
      'node_modules'
    ]
  },

  module: {
    loaders: [
      {
        test: /\.js$/,
        // exclude: /node_modules/, // TODO: uncomment after fix export default in interpolators module
        loader: 'babel-loader',
        query: {
          cacheDirectory: !__PROD__,
          presets: ['es2015'],
          plugins: ['add-module-exports']
        }
      },
      {
        test: /\.scss$/,
        include: [
          path.resolve(__dirname, 'src')
        ],
        loader: extractSrc.extract([
          `css-loader?${JSON.stringify({ sourceMap: true, minimize: __PROD__ })}`,
          'sass-loader'
        ])
      },
      {
        test: /\.scss$/,
        include: [
          path.resolve(__dirname, 'preview')
        ],
        loader: extractPreview.extract(['css-loader', 'sass-loader'])
      },
      {
        test: /\.cur$/,
        loader: 'file-loader',
        query: {
          publicPath: path => path.split('/').slice(1).join('/'),
          name: 'dist/assets/cursors/[name].[ext]'
        }
      },
      {
        test: /\.pug$/,
        loaders: [
          'file-loader?name=[path][name].html',
          'pug-html-loader?exports=false'
        ]
      },
      {
        test: /\.css$/,
        include: [
          path.resolve(__dirname, 'node_modules')
        ],
        loader: 'file-loader',
        query: {
          name: 'preview/assets/vendor/css/[name].[ext]'
        }
      },
      {
        test: /\.(otf|eot|svg|ttf|woff2?)$/,
        include: [
          path.resolve(__dirname, 'node_modules')
        ],
        loader: 'file-loader',
        query: {
          name: 'preview/assets/vendor/fonts/[name].[ext]'
        }
      },
      {
        test: /(d3\.min|\.web)\.js$/, // TODO: we need another way to extract vendor files
        include: [
          path.resolve(__dirname, 'node_modules')
        ],
        loader: 'file-loader',
        query: {
          name: 'preview/assets/vendor/js/[1]/[name].[ext]',
          regExp: new RegExp(`${sep}node_modules${sep}([^${sep}]+?)${sep}`)
        }
      },
      {
        test: /\.html$/,
        include: [path.resolve(__dirname, 'src')],
        loader: 'html-loader',
        query: {
          interpolate: 'require'
        }
      }
    ]
  },

  plugins,

  stats,
  devServer: {
    stats,
    host: '0.0.0.0'
  }
};
