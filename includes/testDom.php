<?php

// just some setup
$dom = new DOMDocument('1.0');
$dom->preserveWhiteSpace = false;
$dom->formatOutput = true;
@$dom->loadHTML("<html><head></head><body><a-scene></a-scene></body></html>");

$html=$dom->documentElement;
$head=$dom->documentElement->childNodes[0];
$body=$dom->documentElement->childNodes[1];
$ascene=$dom->documentElement->childNodes[1]->childNodes[0];

// Head script
$scriptLib = $dom->createElement("script");
$scriptLib->appendChild($dom->createTextNode(''));
$scriptLib->setAttribute("src", "https://aframe.io/releases/1.3.0/aframe.min.js");
$head->appendChild($scriptLib);

// Create a Box
$aBox = $dom->createElement("a-box");
$aBox->appendChild($dom->createTextNode(''));
$aBox->setAttribute("position", "-1 0.5 -3");
$aBox->setAttribute("rotation", "0 45 0");
$aBox->setAttribute("color", "#4CC3D9");
$ascene->appendChild($aBox);

// ----- print to output ----
echo $outXML = $dom->saveXML();

