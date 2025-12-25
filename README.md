# [textarea](https://fraaerasmus.github.io/textarea/)

A minimalist text editor that lives entirely in your browser and stores everything in the URL hash.

## Features

- **URL storage** - Text compressed with deflate and stored in the URL hash
- **Vim mode** - `Esc` to enter normal mode, `i` to insert
  - Navigation: `h` `j` `k` `l`
  - Visual: `v` `V`
  - Edit: `a` `A` `o` `O` `d` `D` `y` `Y` `p` `P` `u` `Ctrl+R`
- **Auto-save** - Debounced saves to localStorage
- **Dark mode** - Respects system preference
- **No backend** - Pure client-side

## Tips

- Start with `# Title` to set the page title
- Share by copying the URL

## Credits

Forked from [antonmedv/textarea](https://github.com/antonmedv/textarea)
