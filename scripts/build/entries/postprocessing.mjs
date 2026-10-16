import * as POSTPROCESSING from 'postprocessing';
import { VRodosGtaoPass } from '../../../assets/js/runtime/master/vrodos_gtao_pass.js';

window.POSTPROCESSING = POSTPROCESSING;
window.VRODOSAmbientOcclusion = Object.freeze({ Pass: VRodosGtaoPass });
