/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/index.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./node_modules/@babel/runtime/helpers/extends.js":
/*!********************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/extends.js ***!
  \********************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

function _extends() {
  module.exports = _extends = Object.assign || function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];

      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }

    return target;
  };

  module.exports["default"] = module.exports, module.exports.__esModule = true;
  return _extends.apply(this, arguments);
}

module.exports = _extends;
module.exports["default"] = module.exports, module.exports.__esModule = true;

/***/ }),

/***/ "./src/blocks/vrodos_block.js":
/*!************************************!*\
  !*** ./src/blocks/vrodos_block.js ***!
  \************************************/
/*! no exports provided */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _babel_runtime_helpers_extends__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime/helpers/extends */ "./node_modules/@babel/runtime/helpers/extends.js");
/* harmony import */ var _babel_runtime_helpers_extends__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_helpers_extends__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_1__);


var registerBlockType = wp.blocks.registerBlockType;
var _wp$blockEditor = wp.blockEditor,
    RichText = _wp$blockEditor.RichText,
    InspectorControls = _wp$blockEditor.InspectorControls,
    useBlockProps = _wp$blockEditor.useBlockProps;
var _wp$components = wp.components,
    TextControl = _wp$components.TextControl,
    ToggleControl = _wp$components.ToggleControl,
    PanelBody = _wp$components.PanelBody,
    PanelRow = _wp$components.PanelRow,
    CheckboxControl = _wp$components.CheckboxControl,
    SelectControl = _wp$components.SelectControl,
    ColorPicker = _wp$components.ColorPicker;
registerBlockType('vrodos/vrodos-3d-block', {
  title: 'VRodos 3D view',
  category: 'widgets',
  icon: 'visibility',
  description: 'Learning in progress',
  keywords: ['example', 'test'],
  attributes: {
    myRichHeading: {
      type: 'string'
    },
    // myRichText: {
    //     type: 'string',
    //     source: 'html',
    //     selector: 'p'
    // },
    title: {
      type: 'string',
      default: 'NoGapsTitle'
    },
    titleshow: {
      type: 'boolean',
      default: false
    },
    favoriteAnimal: {
      type: 'string',
      default: 'dogs'
    },
    favoriteColor: {
      type: 'string',
      default: '#DDDDDD'
    },
    activateLasers: {
      type: 'boolean',
      default: false
    }
  },
  edit: function edit(props) {
    var attributes = props.attributes,
        setAttributes = props.setAttributes;
    var blockProps = useBlockProps();
    return Object(_wordpress_element__WEBPACK_IMPORTED_MODULE_1__["createElement"])("div", null, Object(_wordpress_element__WEBPACK_IMPORTED_MODULE_1__["createElement"])(InspectorControls, null, Object(_wordpress_element__WEBPACK_IMPORTED_MODULE_1__["createElement"])(PanelBody, {
      title: "Most awesome settings ever",
      initialOpen: true
    }, Object(_wordpress_element__WEBPACK_IMPORTED_MODULE_1__["createElement"])(PanelRow, null, Object(_wordpress_element__WEBPACK_IMPORTED_MODULE_1__["createElement"])(TextControl, {
      label: "Title (without spaces)",
      value: attributes.title,
      onChange: function onChange(newval) {
        return setAttributes({
          title: newval
        });
      }
    })), Object(_wordpress_element__WEBPACK_IMPORTED_MODULE_1__["createElement"])(PanelRow, null, Object(_wordpress_element__WEBPACK_IMPORTED_MODULE_1__["createElement"])(ToggleControl, {
      label: "Show title",
      checked: attributes.titleshow,
      onChange: function onChange(newval) {
        return setAttributes({
          titleshow: newval
        });
      }
    })), Object(_wordpress_element__WEBPACK_IMPORTED_MODULE_1__["createElement"])(PanelRow, null, Object(_wordpress_element__WEBPACK_IMPORTED_MODULE_1__["createElement"])(SelectControl, {
      label: "What's your favorite animal?",
      value: attributes.favoriteAnimal,
      options: [{
        label: "Dogs",
        value: 'dogs'
      }, {
        label: "Cats",
        value: 'cats'
      }, {
        label: "Something else",
        value: 'weird_one'
      }],
      onChange: function onChange(newval) {
        return setAttributes({
          favoriteAnimal: newval
        });
      }
    })), Object(_wordpress_element__WEBPACK_IMPORTED_MODULE_1__["createElement"])(PanelRow, null, Object(_wordpress_element__WEBPACK_IMPORTED_MODULE_1__["createElement"])(ColorPicker, {
      color: attributes.favoriteColor,
      onChangeComplete: function onChangeComplete(newval) {
        return setAttributes({
          favoriteColor: newval.hex
        });
      },
      disableAlpha: true
    })), Object(_wordpress_element__WEBPACK_IMPORTED_MODULE_1__["createElement"])(PanelRow, null, Object(_wordpress_element__WEBPACK_IMPORTED_MODULE_1__["createElement"])(CheckboxControl, {
      label: "Activate lasers?",
      checked: attributes.activateLasers,
      onChange: function onChange(newval) {
        return setAttributes({
          activateLasers: newval
        });
      }
    })))), Object(_wordpress_element__WEBPACK_IMPORTED_MODULE_1__["createElement"])(RichText, _babel_runtime_helpers_extends__WEBPACK_IMPORTED_MODULE_0___default()({}, blockProps, {
      tagName: "h2",
      placeholder: "Description of 3D model",
      value: attributes.myRichHeading,
      onChange: function onChange(newtext) {
        return setAttributes({
          myRichHeading: newtext
        });
      }
    })));
  },
  save: function save(props) {
    var attributes = props.attributes;
    return '' // <div>
    //     <RichText.Content
    //         tagName="h2"
    //         value={attributes.myRichHeading}
    //     />
    //     <RichText.Content
    //         tagName="p"
    //         value={attributes.myRichText}
    //     />
    // </div>
    ;
  }
}); // import { registerBlockType } from '@wordpress/blocks';
// import { useBlockProps } from '@wordpress/block-editor';
//
// const blockStyle = {
//     backgroundColor: '#900',
//     color: '#fff',
//     padding: '20px',
// };
//
// registerBlockType( 'vrodos/vrodos-3d-block', {
//     apiVersion: 2,
//     title: 'VRodos 3D view',
//     icon: 'visibility',
//     category: 'widgets',
//     example: {},
//     edit() {
//         const blockProps = useBlockProps( { style: blockStyle } );
//
//         return (
//             <div { ...blockProps }>Hello World, step 1 (from the editor).</div>
//         );
//     },
//     save() {
//         const blockProps = useBlockProps.save( { style: blockStyle } );
//
//         return (
//             <div { ...blockProps }>
//                 Hello World, step 1 (from the frontend).
//             </div>
//         );
//     },
// } );

/***/ }),

/***/ "./src/index.js":
/*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
/*! no exports provided */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _blocks_vrodos_block__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./blocks/vrodos_block */ "./src/blocks/vrodos_block.js");


/***/ }),

/***/ "@wordpress/element":
/*!*********************************!*\
  !*** external ["wp","element"] ***!
  \*********************************/
/*! no static exports found */
/***/ (function(module, exports) {

(function() { module.exports = window["wp"]["element"]; }());

/***/ })

/******/ });
//# sourceMappingURL=index.js.map