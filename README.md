# Twig Adapter

[WIP] An adapter to let you use [Twig](https://github.com/twigjs/twig.js) templates with [Fractal](http://github.com/frctl/fractal).

Currently requires the (unreleased) Fractal v1.1.0-alpha.2 or greater - you can install it in your project using `npm i @frctl/fractal@next --save`.

## How to Setup
 
in your `package.json` 

```json
{
  "Dependencies": {
    "@frctl/twig-drupal": "https://github.com/WondrousLLC/twig-drupal.git",
  }
}
```

in your `fractal.js`

```js
const fractal = require('@frctl/fractal').create();
const twigAdapter = require('@frctl/twig-drupal');
const twig = twigAdapter({
  handlePrefix: '@components/',
});
```
