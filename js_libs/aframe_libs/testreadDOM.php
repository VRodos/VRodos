<?php


$filenameSource = "Master_Client_prototype.html";

// Read prototype
$f_src = fopen( $filenameSource, "r");
$content = fread($f_src, filesize($filenameSource));
fclose($f_src);

$dom = new DOMDocument("1.0", "utf-8");
$dom->resolveExternals = true;

$content = preg_replace('/\>\s+\</m', '><', $content);
$content = preg_replace(['(\s+)u', '(^\s|\s$)u'], [' ', ''], $content);


//echo $content;

@$dom->loadHTML($content);  //LIBXML_NOERROR

$ascene = $dom->documentElement->childNodes[1]->childNodes[1];

print_r($ascene);



                                 // Body        // Div Actions
//print_r($dom->documentElement->childNodes[1]->childNodes[0]->childNodes[0]->attributes[0]->nodeValue);





// ----- print to output ----
echo $outXML = $dom->saveHTML();
