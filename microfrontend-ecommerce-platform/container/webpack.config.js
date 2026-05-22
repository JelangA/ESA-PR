const HtmlWebpackPlugin = require('html-webpack-plugin');
const { ModuleFederationPlugin } = require('webpack').container;

// Export a factory to access argv.mode reliably
module.exports = (_env = {}, argv = {}) => {
  const isProd = argv.mode === 'production';

  return {
    mode: isProd ? 'production' : 'development',
    entry: './src/index.tsx',
    devServer: {
      port: 3000,
      historyApiFallback: true,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    },
    module: {
      rules: [
        {
          test: /\.(js|jsx|ts|tsx)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-react', '@babel/preset-typescript'],
            },
          },
        },
        {
          test: /\.css$/i,
          use: ['style-loader', 'css-loader', 'postcss-loader'],
        },
      ],
    },
    plugins: [
      new ModuleFederationPlugin({
        name: 'container',
        // In production, point to absolute paths served by Vercel from the root
        remotes: isProd
          ? {
              products: 'products@/products/remoteEntry.js',
              cart: 'cart@/cart/remoteEntry.js',
              auth: 'auth@/auth/remoteEntry.js',
            }
          : {
              products: 'products@http://localhost:3001/remoteEntry.js',
              cart: 'cart@http://localhost:3002/remoteEntry.js',
              auth: 'auth@http://localhost:3003/remoteEntry.js',
            },
        shared: {
          react: { singleton: true, eager: false, requiredVersion: '^18.2.0' },
          'react-dom': { singleton: true, eager: false, requiredVersion: '^18.2.0' },
          'react-router-dom': { singleton: true, eager: false, requiredVersion: '^6.8.0' },
          '@microfrontend-ecommerce/shared': { singleton: true, eager: false },
        },
      }),
      new HtmlWebpackPlugin({
        template: './public/index.html',
      }),
    ],
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
    },
  };
};
