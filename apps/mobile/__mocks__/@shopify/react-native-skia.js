// Manual jest mock for @shopify/react-native-skia (activated via jest.mock in
// jest.setup.js). The real Canvas renders through a native Skia view that has no
// react-test-renderer implementation, so under jest it would mount nothing
// queryable. This renders the container/group/shape nodes as plain Views (so the
// surrounding accessibility wrapper + sibling Text stay assertable) and the paint
// leaves (gradient, shadow) as null. No test mounts a real Skia Canvas.
const React = require('react');
const { View } = require('react-native');

function container(name) {
  const C = ({ children }) => React.createElement(View, null, children);
  C.displayName = name;
  return C;
}
function leaf(name) {
  const C = () => null;
  C.displayName = name;
  return C;
}

const Canvas = container('Canvas');
const Group = container('Group');
const Path = container('Path');
const RadialGradient = leaf('RadialGradient');
const Shadow = leaf('Shadow');

const vec = (x, y) => ({ x, y });

// Skia.Path.* return inert path stubs — the component only stores the result and
// hands it to the (mocked) <Path>, never reads geometry off it under test.
const Skia = {
  Path: {
    Make: () => ({}),
    MakeFromSVGString: () => ({}),
  },
};

module.exports = { Canvas, Group, Path, RadialGradient, Shadow, vec, Skia };
