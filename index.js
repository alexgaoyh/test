var list = [];
var imgOverlay = []
var rightBtn = false
// 创建地图实例
var map = new BMapGL.Map("container", {
		minZoom : 3,
		maxZoom : 15
	});
// 初始化地图,设置中心点坐标和地图级别
map.centerAndZoom(new BMapGL.Point(116.404, 39.915), 7);
// map.centerAndZoom(new BMapGL.Point(117.200, 36.2437), 18);
map.enableScrollWheelZoom(true);
map.setMapStyleV2({     
  styleId: 'eb90de97c9ce7849b07dd6d77cab6175'
});

var styleOptions = {
    strokeColor: '#5E87DB',   // 边线颜色
    fillColor: '#5E87DB',     // 填充颜色。当参数为空时，圆形没有填充颜色
    strokeWeight: 2,          // 边线宽度，以像素为单位
    strokeOpacity: 1,         // 边线透明度，取值范围0-1
    fillOpacity: 0.2          // 填充透明度，取值范围0-1
};
var labelOptions = {
    borderRadius: '2px',
    background: '#FFFBCC',
    border: '1px solid #E1E1E1',
    color: '#703A04',
    fontSize: '12px',
    letterSpacing: '0',
    padding: '5px'
};
// 实例化鼠标绘制工具
var drawingManager = new BMapGLLib.DrawingManager(map, {
    // isOpen: true,        // 是否开启绘制模式
    enableDrawingTool: true, // 是否显示工具栏
    enableCalculate: true, // 绘制是否进行测距测面
    enableSorption: true,   // 是否开启边界吸附功能
    sorptiondistance: 20,   // 边界吸附距离
    circleOptions: styleOptions,     // 圆的样式
    polylineOptions: styleOptions,   // 线的样式
    polygonOptions: styleOptions,    // 多边形的样式
    rectangleOptions: styleOptions,  // 矩形的样式
    labelOptions: labelOptions,      // label样式
    drawingToolOptions: {
        enableTips: true,
        hasCustomStyle: true,
        anchor: BMAP_ANCHOR_TOP_LEFT,
        offset: new BMapGL.Size(15, 15), // 偏离值
        scale: 1, // 工具栏缩放比例
        drawingModes: [
            BMAP_DRAWING_MARKER,
            BMAP_DRAWING_POLYLINE,
            BMAP_DRAWING_RECTANGLE,
            BMAP_DRAWING_POLYGON,
            BMAP_DRAWING_CIRCLE,
        ]
    },
});
// drawingManager.addEventListener("polygoncomplete", function(e, overlay) {
//     console.log(e,overlay)
// });


// 绘制完成后获取相关的信息(面积等)
drawingManager.addEventListener('overlaycomplete', function(e) {
    console.log(e)
    e.uuid = new Date().getTime()
    mapSddEvent(e)
    console.log(e.drawingMode)
    if(e.drawingMode == 'marker'){
        // 获取经纬度，弹层，删除
        console.log(e)
        var allOverlay = map.getOverlays();
        for(var i = 0;i<allOverlay.length;i++) {
            if(allOverlay[i].toString()=="Marker"){
                if (allOverlay[i].getPosition().lng == e.overlay.latLng.lng && allOverlay[i].getPosition().lat == e.overlay.latLng.lat) {
                    map.removeOverlay(allOverlay[i]);
                }
            }
        }
        $('#submintBtn').attr('data-uuid',e.uuid);
        $('#submintBtn').attr('type','marker');
        $("#lat").val(e.overlay.latLng.lat);
        $("#lng").val(e.overlay.latLng.lng);
        $('.dialog').attr('style','display:block;')

    }
    if(e.drawingMode == 'rectangle'){
        setImg(e)
    }
    if(e.drawingMode == 'polygon' || e.drawingMode == 'circle'){
        // var pointArray = new Array();//保存坐标数据
        // for(var i = 0; i < e.overlay.points.length - 1; i++) {
        //     var dataPoint = new BMapGL.Point(e.overlay.points[i].latLng.lng, e.overlay.points[i].latLng.lat);
        //     pointArray.push(dataPoint);
        // }
        // var polygon = new BMapGL.Polygon(pointArray,{
        //     strokeWeight: 0.5,
        //     strokeColor: "blue",
        //     fillColor: "blue"
        // }); //建立多边形覆盖物
        // polygon.setFillOpacity(0.3);
        // polygon.disableMassClear();// 禁止清除操作
        // polygon.setZIndex(999999);
        // map.addOverlay(polygon); // 绘制多边形覆盖物
        var uuid = e.uuid;
        var pointStrs = '';//保存坐标数据
        for(var i = 0; i < e.overlay.points.length - 1; i++) {
            pointStrs = pointStrs + e.overlay.points[i].latLng.lng + ',' + e.overlay.points[i].latLng.lat + ';'
        }
        $.get("http://127.0.0.1:30000/geo2image?uuid="+uuid+"&pois=" + pointStrs, function(result){
            var pStart = new BMapGL.Point(result.result.minY,result.result.minX);
            var pEnd = new BMapGL.Point(result.result.maxY,result.result.maxX);
            var bounds = new BMapGL.Bounds(new BMapGL.Point(pStart.lng, pEnd.lat), new BMapGL.Point(pEnd.lng, pStart.lat));
            var imgOverlay = new BMapGL.GroundOverlay(bounds, {
                type: 'image',
                url: result.result.fileUrl,
                opacity: 0.5
            });
            imgOverlay.uuid = uuid
            map.addOverlay(imgOverlay);
        });
    }
});
function mapSddEvent(obj){
    var clickEvts = ['click', 'dblclick', 'rightclick'];
    var moveEvts = ['mouseover', 'mouseout'];
    for (let i = 0; i < clickEvts.length; i++) {
        const event = clickEvts[i];
        obj.overlay.addEventListener(event, function (e,en){
            console.log(e,en)
            var res = null
            switch (event) {
                case 'click':
                    console.log('click')
                    for (let i=0;i<list.length;i++){
                        if(list[i].uuid == obj.uuid){
                            var opts = {
                                width: 250,     // 信息窗口宽度
                                height: 100,    // 信息窗口高度
                                title: list[i].title  // 信息窗口标题
                            }
                            var infoWindow = new BMapGL.InfoWindow(list[i].text, opts);  // 创建信息窗口对象
                            infoWindow.disableCloseOnClick()
                            if(obj.drawingMode == 'marker'){
                                map.openInfoWindow(infoWindow, obj.overlay.latLng);
                            }else{
                                map.openInfoWindow(infoWindow, obj.overlay.points[0].latLng);        // 打开信息窗口
                            }
                         return false
                        }
                    }

                    res = obj.overlay.toString() +  '被单击!';
                    break;
                case 'dbclick':
                    console.log('dbclick')
                    res = obj.overlay.toString() + '被双击!';
                    break;
                case 'rightclick':
                    console.log(this)
                    var menu = new BMapGL.ContextMenu();
                    var txtMenuItem = [
                        {
                            text: '修改',
                            callback: function () {
                                $('.dialog').css('display','block')
                                $('#submintBtn').attr('data-uuid',obj.uuid);
                                map.removeContextMenu(menu);
                            }
                        }, {
                            text: '删除',
                            callback: function (eve) {
                                console.log(1111111,eve)
                                console.log(map.getOverlays())
                                var list = map.getOverlays();
                                list.forEach(item=>{
                                    if(item.uuid == obj.uuid){
                                        map.removeOverlay(item)
                                    }
                                })
                                map.removeContextMenu(menu);
                                map.removeOverlay(e.target);
                            }
                        }
                    ];
                    for (var i = 0; i < txtMenuItem.length; i++) {
                        menu.addItem(new BMapGL.MenuItem(txtMenuItem[i].text, txtMenuItem[i].callback, 100));
                    }
                    if(rightBtn){
                        map.addContextMenu(menu);
                    }else{
                        map.removeContextMenu(menu);
                    }
                    res = obj.overlay.toString() + '被右击!';
            }
            console.log(res)
        });
    }
    if(obj.drawingMode == 'marker'){
        return false
    }
    for (let i = 0; i < moveEvts.length; i++) {
        const event = moveEvts[i];
        obj.overlay.addEventListener(event, e => {
            switch (event) {
                case 'mouseover':
                    obj.overlay.setFillColor('#6f6cd8')
                    rightBtn = true
                    break;
                case 'mouseout':
                    obj.overlay.setFillColor('#fff');
                    rightBtn = false
                    break;
            }
        });
    }
}
function saveContent(_this){
	if($(_this).attr('type') == 'marker') {
		var myIcon = new BMapGL.Icon($("#icon").val(), new BMapGL.Size(50, 50));
		var marker = new BMapGL.Marker(new BMapGL.Point($("#lng").val(), $("#lat").val()),{icon:myIcon});
		map.addOverlay(marker);
		var sContent = "<h4><button onclick=delMarker('"+$("#lng").val()+"','"+$("#lat").val()+"')>点击删除当前标注</button></h4><h4>"+$("#title").val()+"</h4><h6>"+$("#text").val()+"</h6><p style='margin:0;line-height:1.5;font-size:13px;text-indent:2em'>" + $("#lat").val() + "," +$("#lng").val()+ "</p><p style='margin:2;line-height:1.5;font-size:13px;text-indent:2em'>点击下载:下载地址(暂不可用)</p>";
		var infoWindow = new BMapGL.InfoWindow(sContent);
		// marker添加点击事件
		marker.addEventListener('click', function () {
		    this.openInfoWindow(infoWindow);
		});
	}
    let obj = list.some(item=>item.uuid == $(_this).attr('data-uuid'))
    console.log(obj)
    if(obj){
        list.forEach(item=>{
            if(item.uuid == $(_this).attr('data-uuid')){
                item.title=$('#title').val()
                item.text=$('#text').val()
            }
        })
    }else{
        list.push({
            uuid:$(_this).attr('data-uuid'),
            title:$('#title').val(),
            text:$('#text').val()
        })
    }
    $('.dialog').css('display','none')
    // console.log($(_this).attr('data-uuid'))

}
$(".dialog").bind("contextmenu",function(){return false;})



// map.addEventListener('click', function (e) {
//     alert('点击位置经纬度：' + e.latlng.lng + ',' + e.latlng.lat);
// });

function getCity(){
    var bd = new BMapGL.Boundary();
    bd.get('河北省', function (rs) {
        console.log(rs)
        let list = []
        rs.boundaries.forEach(item=>{
            console.log(item.split(";"))
            list = list.concat(item.split(";"))
        })
        let lng = [];
        var lat = [];
        list.forEach(item=>{
            lng.push(item.split(",")[0])
            lat.push(item.split(",")[1])
        })
        console.log(Math.max.apply(Math, lng.map(function(o) {return o})))
        console.log(Math.min.apply(Math, lng.map(function(o) {return o})))
        let maxX =  Math.max.apply(Math, lng.map(function(o) {return o}))
        let minX = Math.min.apply(Math, lng.map(function(o) {return o}))

        console.log(Math.max.apply(Math, lat.map(function(o) {return o})))
        console.log(Math.min.apply(Math, lat.map(function(o) {return o})))
        let maxY =  Math.max.apply(Math, lat.map(function(o) {return o}))
        let minY = Math.min.apply(Math, lat.map(function(o) {return o}))

        var pStart = new BMapGL.Point(minX,minY);
        var pEnd = new BMapGL.Point(maxX,maxY);
        var bounds = new BMapGL.Bounds(new BMapGL.Point(pStart.lng, pEnd.lat), new BMapGL.Point(pEnd.lng, pStart.lat));
        var imgOverlay = new BMapGL.GroundOverlay(bounds, {
            type: 'image',
            url: './1-3000000.png',
            opacity: 1
        });
        console.log(imgOverlay)
        map.addOverlay(imgOverlay);
        // console.log('外轮廓：', rs.boundaries[0]);
        // console.log('内镂空：', rs.boundaries[1]);
        // var hole = new BMapGL.Polygon(rs.boundaries, {
        //     fillColor: 'blue',
        //     fillOpacity: 0.2
        // });
        // map.addOverlay(hole);
    });
}
getCity();
map.setDisplayOptions({
    // poiText: false,  // 隐藏poi标注
    poiIcon: false,  // 隐藏poi图标
    // building: false  // 隐藏楼块
});

function setImg(e){
    console.log(e)
    var pStart = new BMapGL.Point(e.overlay.getPoints()[3].latLng.lng,e.overlay.getPoints()[3].latLng.lat);
    var pEnd = new BMapGL.Point(e.overlay.getPoints()[1].latLng.lng,e.overlay.getPoints()[1].latLng.lat);
    var bounds = new BMapGL.Bounds(new BMapGL.Point(pStart.lng, pEnd.lat), new BMapGL.Point(pEnd.lng, pStart.lat));
    var imgOverlay = new BMapGL.GroundOverlay(bounds, {
        type: 'image',
        url: './30percent.png',
        opacity: 1
    });
    imgOverlay.uuid = e.uuid
    console.log(imgOverlay)
    map.addOverlay(imgOverlay);
};

// function G(id) {
// 	return document.getElementById(id);
// }
	
// var ac = new BMapGL.Autocomplete(    //建立一个自动完成的对象
// 	{"input" : "suggestId"
// 	,"location" : map
// });

// ac.addEventListener("onhighlight", function(e) {  //鼠标放在下拉列表上的事件
// 	var str = "";
// 	var _value = e.fromitem.value;
// 	var value = "";
// 	if (e.fromitem.index > -1) {
// 		value = _value.province +  _value.city +  _value.district +  _value.street +  _value.business;
// 	}    
// 	str = "FromItem<br />index = " + e.fromitem.index + "<br />value = " + value;
	
// 	value = "";
// 	if (e.toitem.index > -1) {
// 		_value = e.toitem.value;
// 		value = _value.province +  _value.city +  _value.district +  _value.street +  _value.business;
// 	}    
// 	str += "<br />ToItem<br />index = " + e.toitem.index + "<br />value = " + value;
// 	console.log(str);
// 	G("searchResultPanel").innerHTML = str;
// });

// var myValue;
// ac.addEventListener("onconfirm", function(e) {    //鼠标点击下拉列表后的事件
// var _value = e.item.value;
// 	myValue = _value.province +  _value.city +  _value.district +  _value.street +  _value.business;
// 	G("searchResultPanel").innerHTML ="onconfirm<br />index = " + e.item.index + "<br />myValue = " + myValue;
	
// 	setPlace();
// });

// function setPlace(){
// 	// map.clearOverlays();    //清除地图上所有覆盖物
// 	function myFun(){
// 		var pp = local.getResults().getPoi(0).point;    //获取第一个智能搜索的结果
// 		map.centerAndZoom(pp, 18);
// 		map.addOverlay(new BMapGL.Marker(pp));    //添加标注
// 	}
// 	var local = new BMapGL.LocalSearch(map, { //智能搜索
// 	  onSearchComplete: myFun
// 	});
// 	local.search(myValue);
// }

$("#suggestId").bind("input propertychange",function(event){
	   $.ajax({
			url:"https://api.map.baidu.com/place/v2/suggestion?region=%E4%B8%AD%E5%9B%BD&output=json&callback=callback&ak=NXO0D9UthHAdoT5c3S5lwvGH&query=" + $("#suggestId").val(),
			dataType: 'jsonp',
			success:callback
		});
});

//自定义回调函数
function callback(rs) {
	$("#searchResultPanel").attr("style","display:block;");//显示div
	if(rs.message === 'ok' && rs.status == 0) {
		$("#searchResultPanel").html('');
		var html = '<div>';
		var array = rs.result;
		for(var i = 0; i < array.length; i++) {
			
			html = html + "<div class='suggestDiv' onclick=divDialogClick('"+array[i].uid+"','"+array[i].name+"','"+array[i].location.lat+"','"+array[i].location.lng+"')>";
			html = html + '<li>名称：'+array[i].name+'</li>';
			html = html + '<li>经纬度：'+array[i].location.lat + ',' + array[i].location.lng +'</li>';
			html = html + '<li>地区：'+array[i].province + array[i].city + array[i].city + array[i].district + array[i].address + '</li>';
			html = html + '</div>';
		}
		html = html + '</div>';
		$("#searchResultPanel").append(html);
	    $("#searchResultPanel").attr("style","display:block;");//显示div
	}
}

function divDialogClick(uid, name, lat, lng) {
	$('#submintBtn').attr('data-uuid',uid);
	$('#submintBtn').attr('type','marker');
	$("#title").val(name);
	$("#lat").val(lat);
	$("#lng").val(lng);
	$('.dialog').attr('style','display:block;')
	$("#searchResultPanel").attr("style","display:none;");
}

function delMarker(lng, lat) {
	console.log(lng, lat);
	var allOverlay = map.getOverlays();
	for(var i = 0;i<allOverlay.length;i++) {
		if(allOverlay[i].toString()=="Marker"){
			if (allOverlay[i].getPosition().lng.toFixed(6) == Number(lng).toFixed(6) && allOverlay[i].getPosition().lat.toFixed(6) == Number(lat).toFixed(6)) {
				map.removeOverlay(allOverlay[i]);
			}
		}
	}
}

function onProvince(selectProvince) {
    var value = selectProvince.value;
    console.log(value);
    getBoundaryAdd(value);
}

// 全局记录省份边界点，为了后续移除使用
var provinceBoundary = [];

function getBoundaryAdd(name){
    var bdary = new BMapGL.Boundary();
    bdary.get(name, function(rs){       //获取行政区域
        var count = rs.boundaries.length; //行政区域的点有多少个
        for(var i = 0; i < count; i++){
            var ply = new BMapGL.Polygon(rs.boundaries[i], {strokeWeight: 2, strokeColor: "#ff0000"}); //建立多边形覆盖物
            provinceBoundary.push(ply);
            map.addOverlay(ply);  //添加覆盖物
            map.setViewport(ply.getPath());    //调整视野
        }
    });
}

function getBoundaryRemove(){
    for(var i = 0; i < provinceBoundary.length; i++){
        map.removeOverlay(provinceBoundary[i]);
    }
    provinceBoundary = [];
}
