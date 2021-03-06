/*! *****************************************************************************
작성자 : 김성현
소속   : (주)iKooB 개발부 프론트 엔지니어
이메일 : seonghyun.kim@ikoob.com
작성일 : 2019.05.21
이름   : rader chart v1.0
설명   : 3rd라이브러리 없이 가볍게 만들어진 원 차트다. 원 차트 항목의 범위를 마우스 클릭이동 형식으로 유동적으로 변경이 가능하다.
기술스펙:
 - HTML5
 - CSS3
 - ES5+ 

이력: 
 - 2019.05.22 [ 마우스가 항목의 범위로 이동 할 시 커서 스타일 변경 완료 ]
 - 2019.05.23 [ 마우스 클릭무브를 통한 항목 동적이동 완료 (*TODO 다음, 이전 항목의 범위를 넘어가지 못하는 로직 필요...)]

영역순서:
  1. variable definition 
  2. function definition 
  3. event listener definition 
  4. helper difinition
***************************************************************************** */



/** ====================================================================================================================================*
 *                                                      1. variable definition                                                          *  
 *======================================================================================================================================*/

/**
 * 캔버스 객체
 * @type {HTMLElement}
 */
let canvas = document.getElementById("canvas");

/**
 * 컨텍스트 객체
 * @type {object}
 */
let ctx = canvas.getContext("2d");

/**
 * 차트헬퍼 오브젝트
 * @type {Object}
 */
let chartHelper;

/**
 * 반지름
 * @type {Number}
 */
let radius = null;

/**
 * 마우스 누름 여부
 * @type {Boolean}
 */
let isMouseDown = false;

/**
 * 항목영역 사각형의 x, y, w, h 목록
 * @type {Object[]}
 */
let itemRects = [];

/**
 * 선택된 항목의 인덱스
 * @type {Number}
 */
let selItemIdx = null;

/**
 * 이동중인 좌표
 * @type {Number}
 */
let curMovingCoordinate = { "x": null, "y": null };


/**
 * 항목 목록
 * @TODO 추후 서버에서 데이터 받아올것!
 * @type {Object[]}
 */
let items = [
    { "nm": "sh1", "high": 80, "x": null, "y": null },
    { "nm": "sh2", "high": 50, "x": null, "y": null },
    { "nm": "sh3", "high": 70, "x": null, "y": null },
    { "nm": "sh4", "high": 50, "x": null, "y": null },
    { "nm": "sh5", "high": 80, "x": null, "y": null },
];

/**
 * 차트 프로퍼티
 * @type {Object}
 */
const chartProperty = {
    circle: {
        STROKE_STYLE: '#E3E3E3'
    },
    item: {
        RECT_STROKE_STYLE: "#E3E3E3",
        RECT_FILL_STYLE: "white",
        RECT_LINE_WIDTH: 4,
        FONT: `${canvas.width / 2 * 0.80 * 0.11}px arial`,
        FONT_FILL_STYLE: "#000000"
    },

    direction: {
        STROKE_STYLE: "#E3E3E3",
        LINE_WIDTH: 6
    },
    range: {
        STROKE_STYLE: "red",
        FILL_STYLE: "red",
        GLOBAL_ALPHA: 0.2
    }
};

/** ====================================================================================================================================*
 *                                                      2. function definition                                                          *  
 *======================================================================================================================================*/


/**
 * 차트생성을 위한 초기화 함수다.
 * @method init
 */
(function init() {
    // 원주율을 기준으로 영역을 초기화한다.
    radius = canvas.height / 2;
    ctx.translate(radius, radius);
    radius = radius * 0.80;
    
    // 차트헬퍼를 초기화한다.
    chartHelper = chartHelperFn();

    // 차트생성을 요청한다.
    drawChart();
}());

/**
 * 차트를 생성한다.
 * @method drawChart
 */
function drawChart() {
    // 0. 캔버스를 초기화한다.
    ctx.clearRect(-canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
    // 1. 차트의 바탕인 원을 그린다.
    drawCircle();
    // 2. 차트의 항목을 그린다.
    drawItem();
    // 3. 차트의 항목을 표시할 방향 곡선을 그린다.
    drawDirection();
    // 4. 차트의 수치를 나타낼 범위를 그린다.
    drawRange();
}

/**
 * 원을 그린다.
 * @method drawCircle
 */
function drawCircle() {
    let i = 0;
    for (i = 0; i < 11; i++) {
        ctx.beginPath();
        ctx.arc(0, 0, radius / 10 * i, 0, 2 * Math.PI);
        ctx.strokeStyle = chartProperty.circle.STROKE_STYLE;
        ctx.stroke();
    }
}

/**
 * 항목을 그린다.
 * @method drawItem
 */
function drawItem() {
    let radian = null;
    let rect = {};

    itemRects = [];
    ctx.globalAlpha = 1;
    ctx.font = chartProperty.item.FONT;
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";

    items.forEach((item, idx) => {
        // x, y좌표를 구한다.
        radian = chartHelper.getRadianFromItem(item, idx);
        x = Math.sin(radian) * radius * 1.15;
        y = -Math.cos(radian) * radius * 1.1;

        // 움직이고있는 항목의 x, y 좌표를 저장한다.
        if (isMouseDown && idx === selItemIdx) {
            item.x = x;
            item.y = y;
        }

        // 사각형의 감싸진 텍스트를 그린다.
        rect = { "x": x, "y": y, "w": ctx.measureText(item.nm).width + 4, "h": 40 };
        ctx.lineWidth = chartProperty.item.RECT_LINE_WIDTH;
        ctx.strokeStyle = chartProperty.item.RECT_STROKE_STYLE;
        ctx.fillStyle = chartProperty.item.RECT_FILL_STYLE;
        chartHelper.roundRectForItem(ctx, rect.x - (canvas.width * (4 / 100)), rect.y - (canvas.height * (4 / 100)), rect.w, rect.h, 10, true);
        ctx.fillStyle = chartProperty.item.FONT_FILL_STYLE;
        ctx.fillText(items[idx].nm, x, y);
        itemRects[idx] = rect;
    });
}

/**
 * 방향을 그린다.
 * @method drawDirection
 */
function drawDirection() {
    let radian;

    ctx.beginPath();
    ctx.strokeStyle = chartProperty.direction.STROKE_STYLE;

    ctx.font = '14px arial';
    ctx.globalAlpha = chartProperty.range.GLOBAL_ALPHA;
    items.forEach((item, idx) => {
        // x, y좌표를 구한다.
        radian = chartHelper.getRadianFromItem(item, idx);
        x = Math.sin(radian) * radius;
        y = -Math.cos(radian) * radius;

        // 항목의 위치를 가르킬 방향선을 그린다.
        ctx.moveTo(0, 0);
        ctx.lineTo(x, y);
        ctx.lineWidth = chartProperty.direction.LINE_WIDTH;
        ctx.stroke();

        var c = 4;
        for (i = 0; i < 11; i++) {
            ctx.fillText(i, (x / 10 * i) - c, (y / 10 * i) - c);
        }
    });
}

/**
 * 범위를 그린다.
 * @method drawRange
 */
function drawRange() {
    let x
        , y
        , radian
        , high;

    ctx.beginPath();
    items.forEach((item, idx) => {
        // x, y좌표를 구한다.
        radian = chartHelper.getRadianFromItem(item, idx);
        high = radius * (item.high / 100);
        x = Math.sin(radian) * (high);
        y = -Math.cos(radian) * (high);

        // 항목별 높이를 연결한다.
        idx === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });

    // 연결된 높이들을 스타일을 적용한다.
    ctx.closePath();
    ctx.strokeStyle = chartProperty.range.STROKE_STYLE;
    ctx.fillStyle = chartProperty.range.FILL_STYLE;
    ctx.globalAlpha = chartProperty.range.GLOBAL_ALPHA;
    ctx.fill();
    ctx.stroke();
}



/** ====================================================================================================================================*
 *                                                      3. event listener definition                                                    *  
 *======================================================================================================================================*/

 
/**
 * 캔버스 이벤트 리스너를 초기화한다.
 * @TODO 크로스브라우징, 모바일 기기 고려하는 로직 추가 할것
 */
(function canvasEventListener() {
    canvas.onmousedown = function (event) {
        isMouseDown = true;
        selItemIdx = chartHelper.checkCursorRange(event);

        if (selItemIdx !== null) {
            chartHelper.getPointDegreeOrRadian(itemRects[selItemIdx === 0 ? items.length - 1 : selItemIdx - 1], true);
            chartHelper.getPointDegreeOrRadian(itemRects[selItemIdx === items.length - 1 ? 0 : selItemIdx + 1], true);
        }
    }

    canvas.onmousemove = function (event) {
        let mousePos = chartHelper.getMousePos(event);
        chartHelper.checkCursorRange(event);

        // ================================================= [TEMP1 - START] 차트 정보 표시를 위한 임시로직 ============================================
        document.querySelector('p')
        .innerHTML = `
        S = ${!items[selItemIdx] ? '?' : items[selItemIdx].nm} <br/>  
        X = ${!items[selItemIdx] ? '?' : parseInt(items[selItemIdx].x, 10)} <br/>
        Y = ${!items[selItemIdx] ? '?' : parseInt(items[selItemIdx].y, 10)} <br/>
        D = ${!items[selItemIdx] ? '?' : parseInt(chartHelper.getPointDegreeOrRadian(curMovingCoordinate), 10)} 
        <hr> 
        mX = ${mousePos.x} <br/> 
        mY = ${mousePos.y} <br/>
        `;
        // ================================================= [TEMP1 - END] 차트 정보 표시를 위한 임시로직 ================================================

        // 마우스가 항목을 클릭하고 있는 상태라면...
        if (isMouseDown && selItemIdx !== null) {
            // 현재 마우스 값을 기준으로 선택된 항목을 다시 그린다.
            curMovingCoordinate = { "x": mousePos.x, "y": mousePos.y };
            chartHelper.getPointDegreeOrRadian(curMovingCoordinate);
            drawChart();

            // TODO 이전 항목과 다음 항목을 넘어가지 않도록 로직 구사할것
            // if (curDegree > prevDegree && curDegree < nextDegree || curDegree < prevDegree && curDegree < nextDegree || curDegree > prevDegree && curDegree > nextDegree) {
            // drawChart();
            // }
        }
    }

    canvas.onmouseup = function (event) {
        isMouseDown = false;
        let mousePos = chartHelper.getMousePos(event);

        // 선택된 항목의 x, y좌표를 마지막 값으로 수정한다.
        if (selItemIdx !== null) {
            items[selItemIdx].x = mousePos.x;
            items[selItemIdx].y = mousePos.y;
        }
    }

    canvas.onmouseleave = function () {
        isMouseDown = false;
        selItemIdx = null;
    }
}());


/** ====================================================================================================================================*
 *                                                      4. helper difinition                                                            *  
 *======================================================================================================================================*/


/**
 * 차트 헬퍼 오브젝트이다.
 * @method chartHelperFn
 */
function chartHelperFn() {
    return {
        /**
         * 항목을 감싸는 사각형을 그린다.
         * 
         * @param {object} ctx 캔버스 컨텍스트
         * @param {Number} x x축
         * @param {Number} y y축
         * @param {Number} w 넓이
         * @param {Number} h 높이
         * @param {Number} radius 반지름
         * @param {Boolean} fill 채움 여부
         * @param {Boolean} stroke 그리기 여부
         */
        roundRectForItem: function (ctx, x, y, w, h, radius = 5, fill, stroke = true) {
            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + w - radius, y);
            ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
            ctx.lineTo(x + w, y + h - radius);
            ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
            ctx.lineTo(x + radius, y + h);
            ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
            ctx.closePath();
            if (stroke) {
                ctx.stroke();
            }
            if (fill) {
                ctx.fill();
            }
        },

        /**
         * 마우스 커서활성화 영역인지 검사 한다.
         * @TODO 활성화된 영역의 인덱스를 반환함... 명확함 메서드명과 주석으로 수정 할 것
         * @param {Event} e 클릭 이벤트 객체
         */
        checkCursorRange: function (e) {
            let mousePos = this.getMousePos(e);
            let selIdx = null;

            itemRects.some((rect, idx) => {
                if (mousePos.x >= rect.x - (canvas.width * (4 / 100)) && mousePos.x <= rect.x - (canvas.height * (4 / 100)) + rect.w &&
                    mousePos.y >= rect.y - (canvas.width * (4 / 100)) && mousePos.y <= rect.y - (canvas.height * (4 / 100)) + rect.h) {
                    canvas.style.cursor = "pointer";
                    selIdx = idx;
                    return true;
                }

                canvas.style.removeProperty("cursor");
                return false;
            });

            return selIdx;
        },

        /**
         * 마우스의 좌표를 반환한다.
         * @param {Event} e 클릭 이벤트 객체
         */
        getMousePos: function (e) {
            let r = canvas.getBoundingClientRect();
            return {
                x: e.clientX - r.left - canvas.width / 2,
                y: e.clientY - r.top - canvas.height / 2
            };
        },


        /**
         * 각도 혹은 라디안을 반환한다.
         * @method getPointDegreeOrRadian
         * @param {Object} coor x, y 좌표값
         * @param {Boolean} isRadian 라디안반환 여부
         * @return {Number} 각도 혹은 라디안
         */
        getPointDegreeOrRadian: function (coor, isRadian = false) {
            let degree = 180 - Math.atan2(coor.x, coor.y) * (180 / Math.PI);
            return isRadian ? degree * (Math.PI / 180) : degree;
        },

        /**
         * 항목의 라디안을 반환한다.
         * @method getRadianFromItem
         * @param {Object} item 항목
         * @param {Number} idx 인덱스
         * @return {Number} 항목의 라디안 값
         */
        getRadianFromItem: function (item, idx) {
            let radian;

            if (isMouseDown && idx === selItemIdx) {
                radian = this.getPointDegreeOrRadian(curMovingCoordinate, true);
            }
            else if (item.x !== null) {
                radian = this.getPointDegreeOrRadian(item, true);
            }
            else {
                radian = idx * Math.PI / (items.length / 2);
            }

            return radian;
        }
    }
};