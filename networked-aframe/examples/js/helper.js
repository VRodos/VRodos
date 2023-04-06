let api_pattern_single = {
    ThresholdMin: 0.106,
    ThresholdMax: 0.13,
    red: 48, green: 146, blue: 89,
    w: 1, h: 0.75,
    x: 0, y:0, z:0,
    rx: 0, ry: 0, rz:0
};

let api_pattern_singleMin = {
    ThresholdMinLow: 0,
    ThresholdMaxLow: 0,
    redLow: 0,
    greenLow: 0,
    blueLow: 0,
    wLow: 0.1,
    hLow: 0.1,
    xLow:-100000,
    yLow:-100000,
    zLow:-100000,
    rxLow:-100,
    ryLow:-100,
    rzLow:-100
};
let api_pattern_singleMax = {
    ThresholdMinHigh: 0.4,
    ThresholdMaxHigh: 0.4,
    redHigh: 255,
    greenHigh: 255,
    blueHigh: 255,
    wHigh: 5,
    hHigh: 5,
    xHigh: 100000,
    yHigh: 100000,
    zHigh: 100000,
    rxHigh: 100,
    ryHigh: 100,
    rzHigh: 100
};
let api_pattern_singleStep = {
    ThresholdMinStep: 0.001,
    ThresholdMaxStep: 0.001,
    redStep: 1,
    greenStep: 1,
    blueStep: 1,
    wStep: 0.05,
    hStep: 0.05,
    xStep: 10,
    yStep: 10,
    zStep: 10,
    rxStep: 0.1,
    ryStep: 0.1,
    rzStep: 0.1
};

export {api_pattern_single, api_pattern_singleMin, api_pattern_singleMax, api_pattern_singleStep}