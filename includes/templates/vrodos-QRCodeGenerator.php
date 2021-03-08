<?php if (!isset($_GET['qrcode'])){ ?>
    
    <div id="qrcode_div" class="qrcode_div">
        
        <button id='qrcode_button' class="qrcode_button"  onclick="toggleQRcode()">
            x
        </button>
        
        <script>
            function toggleQRcode(){

                var dom = document.getElementById('qrcode_div');
                var dom_img_div = document.getElementById('qrcode_img_div');
                var dombutton = document.getElementById('qrcode_button');

                if(dom_img_div.style.display != 'none') {
                    dom.style.width = 20;
                    dom.style.height = 20;
                    dom_img_div.style.display = 'none';
                    dombutton.innerText = 'o';
                }else {
                    dom.style.width = 180;
                    dom.style.height = 200;
                    dom_img_div.style.display = 'block';
                    dombutton.innerText = 'x';
                }
            }
        </script>
        
        
        <div id="qrcode_img_div" class="qrcode_img_div">
            View at your device
            <div id="qrcode_img" class="qrcode_img"></div>
        </div>
    </div>
<?php } ?>


