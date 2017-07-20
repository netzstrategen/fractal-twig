# Fractal Twig Drupal adapter

This fork allows you to use the namespaces from your `theme.info.yml` file from the `component-libraries` key in your Fractal instance.

## How to Setup
 
in your `package.json` 

```json
{
  "dependencies": {
    "@frctl/twig-drupal": "https://github.com/netzstrategen/twig-drupal.git",
  }
}
```

in your `fractal.js`

```js
const fractal = require('@frctl/fractal').create();
const twigAdapter = require('@frctl/twig-drupal');
fractal.components.engine(twigAdapter);
```

## Todo
- [ ] Allow multiple paths per namespace

## Credits
This fork is based on the fork of [WONDROUS](https://github.com/WondrousLLC/twig-drupal).
