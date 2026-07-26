import * as VRODOSTakramAtmosphere from '@takram/three-atmosphere';
import * as VRODOSTakramEffects from '@takram/three-geospatial-effects';

window.VRODOS_TAKRAM_ATMOSPHERE = Object.assign(
  {},
  VRODOSTakramAtmosphere,
  VRODOSTakramEffects
);
window.VRODOS_TAKRAM_EFFECTS = VRODOSTakramEffects;
