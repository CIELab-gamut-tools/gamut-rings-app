# Gamut Rings Explorer

This is a single page, single file, HTML app designed to allow the exploration of the Gamut Rings plot to improve understanding of it.
- A single HTML file, can be opened from a file and easily distributed.  No server needed.
- Interactive, users can interact with the CIE chromaticity plot showing the nominal RGB primaries and white point of an additive display and observe in near real-time the impact on the gamut rings plot.
- Built using [Vue3](https://vuejs.org/) and [Vite](https://vitejs.dev/)
- Calculations using the [t-matrix](https://github.com/euan-smith/t-matrix) library plus hand-optimised inner loops.
- Rendered using webgl2

## Run a dev server

```bash
npm run dev
```

## Build

```bash
npm run build
```

Produces dist/index.html.  This file can be opened anywhere

## References

- Original Gamut Rings concept: [K. Masaoka, F. Jiang, M. D. Fairchild, and R. L. Heckaman,
SID Digest, Volume 49, Issue 1, May 2018, 1048-1051](https://doi.org/10.1002/sdtp.12187)
- Calculation based on: [E. Smith, R. L. Heckaman, K. Lang, J. Penczek, J. Bergquist,
JSID, Volume 28, Issue 6, June 2020, 548-556.](https://doi.org/10.1002/jsid.918)
