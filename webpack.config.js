const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');
const dotenv = require('dotenv');
const fs = require('fs');

// Get the environment
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_VERCEL = process.env.VERCEL === '1';

// Determine the appropriate publicPath based on environment
const getPublicPath = () => {
  if (IS_VERCEL) {
    return '/'; // Use absolute paths for Vercel
  }
  return NODE_ENV === 'production' ? '/' : '/'; // Ensure consistency in local and prod
};

// Load the .env file based on the environment
const envFile = NODE_ENV === 'production' ? '.env.production' : '.env';
const envPath = path.resolve(__dirname, envFile);

// Parse the env file
const envParsed = fs.existsSync(envPath) 
  ? dotenv.parse(fs.readFileSync(envPath)) 
  : {};

// Construct environment variables object with defaults
const envKeys = Object.keys(envParsed).reduce((prev, key) => {
  prev[`process.env.${key}`] = JSON.stringify(envParsed[key]);
  return prev;
}, {
  // Provide default values for Firebase config to prevent errors
  'process.env.REACT_APP_FIREBASE_API_KEY': JSON.stringify(process.env.REACT_APP_FIREBASE_API_KEY || envParsed.REACT_APP_FIREBASE_API_KEY || ''),
  'process.env.REACT_APP_FIREBASE_AUTH_DOMAIN': JSON.stringify(process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || envParsed.REACT_APP_FIREBASE_AUTH_DOMAIN || ''),
  'process.env.REACT_APP_FIREBASE_PROJECT_ID': JSON.stringify(process.env.REACT_APP_FIREBASE_PROJECT_ID || envParsed.REACT_APP_FIREBASE_PROJECT_ID || ''),
  'process.env.REACT_APP_FIREBASE_STORAGE_BUCKET': JSON.stringify(process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || envParsed.REACT_APP_FIREBASE_STORAGE_BUCKET || ''),
  'process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || envParsed.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || ''),
  'process.env.REACT_APP_FIREBASE_APP_ID': JSON.stringify(process.env.REACT_APP_FIREBASE_APP_ID || envParsed.REACT_APP_FIREBASE_APP_ID || ''),
  'process.env.REACT_APP_FIREBASE_MEASUREMENT_ID': JSON.stringify(process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || envParsed.REACT_APP_FIREBASE_MEASUREMENT_ID || ''),
  'process.env.REACT_APP_OPENROUTER_API_KEY': JSON.stringify(process.env.REACT_APP_OPENROUTER_API_KEY || envParsed.REACT_APP_OPENROUTER_API_KEY || '')
});

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'bundle.js',
    publicPath: getPublicPath(),
    clean: true
  },
  optimization: {
    splitChunks: false
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react']
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/,
        type: 'asset/resource'
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
      filename: 'index.html',
      inject: 'body', // Change from true to 'body' to ensure scripts are at the end of body
      scriptLoading: 'defer', 
      hash: true, // Add hash to script URLs to prevent caching issues
      publicPath: getPublicPath(), // Explicitly set publicPath here too
      // Add public path variable to be used in the template
      templateParameters: (compilation, assets, options) => {
        return {
          PUBLIC_URL: getPublicPath(),
          IS_VERCEL: IS_VERCEL,
          webpackConfig: compilation.options,
          htmlWebpackPlugin: {
            tags: assets.assetTags,
            files: assets.files,
            options: options
          }
        };
      },
      // Preserve the path-fix scripts in the HTML
      scriptExtHtmlWebpackPlugin: {
        inline: ['path-fix.js', 'vercel-path-fix.js']
      },
      minify: {
        removeComments: false, // Keep comments to preserve script tags
        collapseWhitespace: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        removeStyleLinkTypeAttributes: true,
        keepClosingSlash: true,
        minifyJS: true,
        minifyCSS: true,
        minifyURLs: true
      },
      templateParameters: (compilation, assets, assetTags, options) => {
        return {
          PUBLIC_URL: '/', // Set to '/' for absolute paths in production
          compilation: compilation,
          webpackConfig: compilation.options,
          htmlWebpackPlugin: {
            tags: assetTags,
            files: assets,
            options: options
          },
          REACT_APP_FIREBASE_API_KEY: process.env.REACT_APP_FIREBASE_API_KEY || envParsed.REACT_APP_FIREBASE_API_KEY || 'AIzaSyCUlHCKRwkIpJX0PXc3Nvt_l2HmfJwyjC0',
          REACT_APP_FIREBASE_AUTH_DOMAIN: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || envParsed.REACT_APP_FIREBASE_AUTH_DOMAIN || 'timetable-28639.firebaseapp.com',
          REACT_APP_FIREBASE_PROJECT_ID: process.env.REACT_APP_FIREBASE_PROJECT_ID || envParsed.REACT_APP_FIREBASE_PROJECT_ID || 'timetable-28639',
          REACT_APP_FIREBASE_STORAGE_BUCKET: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || envParsed.REACT_APP_FIREBASE_STORAGE_BUCKET || 'timetable-28639.appspot.com',
          REACT_APP_FIREBASE_MESSAGING_SENDER_ID: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || envParsed.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || '653769103112',
          REACT_APP_FIREBASE_APP_ID: process.env.REACT_APP_FIREBASE_APP_ID || envParsed.REACT_APP_FIREBASE_APP_ID || '1:653769103112:web:7b7fe45718bec053843ebd',
          REACT_APP_FIREBASE_MEASUREMENT_ID: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || envParsed.REACT_APP_FIREBASE_MEASUREMENT_ID || 'G-J0F10129PJ'
        };
      }
    }),
    new webpack.DefinePlugin(envKeys),
    new CopyWebpackPlugin({
      patterns: [
        { 
          from: 'src/assets', 
          to: 'assets' 
        },
        {
          from: 'public/404.html',
          to: '404.html',
          noErrorOnMissing: true  // This ensures webpack doesn't fail if the file is missing
        },
        {
          from: 'public/favicon.ico',
          to: 'favicon.ico',
          noErrorOnMissing: true
        },
        {
          from: 'public/path-fix.js',
          to: 'path-fix.js',
          noErrorOnMissing: true
        },
        {
          from: 'public/vercel-path-fix.js',
          to: 'vercel-path-fix.js',
          noErrorOnMissing: true
        },
        {
          from: 'mobile.html',
          to: 'mobile.html',
          noErrorOnMissing: true
        },
        {
          from: 'mobile-signin.html',
          to: 'mobile-signin.html',
          noErrorOnMissing: true
        },
        {
          from: 'src/utils/EnglishTruncationFixStandalone.js',
          to: 'EnglishTruncationFixStandalone.js'
        },
        {
          from: 'src/utils/EnglishTruncationFixDirectGlobal.js',
          to: 'EnglishTruncationFixDirectGlobal.js'
        },
        {
          from: 'src/compatibility-polyfill.js',
          to: 'compatibility-polyfill.js'
        },
        {
          from: 'src/webpack-config-override.js',
          to: 'webpack-config-override.js'
        }
        // Removed _redirects to avoid directory/file confusion
        // We'll handle it in the postbuild script
      ]
    })
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
    },
    port: 3001,
    hot: true,
    historyApiFallback: true,
    open: true,
    compress: true,
    proxy: [
      {
        context: ['/api'],
        target: 'https://timetable-28639.web.app',
        changeOrigin: true,
        secure: false
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx'],
    // Add this alias to help resolve the "run" module error
    alias: {
      // This helps prevent the "Can't resolve 'run'" error
      'run': path.resolve(__dirname, 'src/utils/empty.js')
    }
  }
};
