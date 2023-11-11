window.onload = function() {
    loadPage('https://magic.ninomae.cn'); // 默认加载Google首页
}

function loadPage(url) {
    document.getElementById('contentFrame').src = url;
    //closeNav();
}

/**/
function openNav() {
  document.getElementById("mySidepanel").style.width = "250px";
  //setTimeout(closeNav, 8000);  // 10秒后自动关闭
}

function closeNav() {
  document.getElementById("mySidepanel").style.width = "0";
}

window.onclick = function(event) {
    var sidepanel = document.getElementById("mySidepanel");
    if (event.target == sidepanel) {
        closeNav();
    }
}
