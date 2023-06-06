<?php if (!isset($_GET['qrcode'])){ ?>
    
    <div id="qrcode_div" class="qrcode_div">
        <button id='qrcode_button' class="qrcode_button"  onclick="toggleQRcode()">
            x
        </button>
        
        <script>
            function toggleQRcode() {

                let element = document.getElementById('qrcode_div');
                let el_img = document.getElementById('qrcode_img_div');
                let el_btn = document.getElementById('qrcode_button');

                if(el_img.style.display !== 'none') {
                    element.style.width = 20;
                    element.style.height = 20;
                    el_img.style.display = 'none';
                    el_btn.innerText = 'o';
                }else {
                    element.style.width = 180;
                    element.style.height = 180;
                    el_img.style.display = 'block';
                    el_btn.innerText = 'x';
                }
            }
        </script>

        <div id="qrcode_img_div">
            <img alt="QrCode image" id="qrcode_img" class="qrcode_img">
        </div>
    </div>
<?php } ?>


