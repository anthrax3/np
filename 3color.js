 
function main() {

    //Constant declarations
    //   ctx -- the HTML5 canvas context
    //   RADIUS -- the radius of regions to-draw
    var canvas = document.getElementById("myCanvas");
    var ctx = canvas.getContext("2d");
    
    var WIDTH = Math.min(970, window.innerWidth);
    var HEIGHT = Math.min(600, window.innerHeight);
    ctx.canvas.width  = WIDTH;
    ctx.canvas.height  = HEIGHT;

    var RADIUS = 30;
    var MINDIST = 2*RADIUS;
    var MAXLINK = Math.sqrt(WIDTH*HEIGHT)/3.5;

    var RED = "#db0707";
    var YELLOW = "#ffdd00";
    var BLUE = "#0d36db";
    var BLACK = "#000000";
    var WHITE = "#FFFFFF";
    var GREY = "#222222";

    var COLORS = [GREY, RED, YELLOW, BLUE];

    // Functions and helper methods
    function getRandom(min, max) {
        return Math.random() * (max - min) + min;
    }

    function distance(a, b) {
        return Math.sqrt((a.x-b.x) * (a.x-b.x) + (a.y-b.y) * (a.y-b.y));
    }

    function randPoint() {
        return Point(getRandom(RADIUS, WIDTH-RADIUS), getRandom(RADIUS, HEIGHT-RADIUS));
    }

    function Point(X,Y) {
        return {x:X, y:Y}
    }

    function pointsAreEqual(a,b) {
        return (a.x === b.x) && (a.y == b.y);
    }

    function neighborsVia(links) {
        function neighborsOf(point) {
            var output = [];
            for (var i=0; i<links.length; i++) {
                if (pointsAreEqual(links[i][0], point)) {
                    output.push(links[i][1]);
                }
                if (pointsAreEqual(links[i][1], point)) {
                    output.push(links[i][0]);
                }
            }
            return output;
        }
        return neighborsOf;
    }

    function generatePoints() {
        /*Generate an array of Point objects.*/
        var nils = [0,0,0,0,0,0,0,0,0,0,0,0,0];
        points = nils.map(randPoint);

        // Prevent collisions
        for (var i=0; i<points.length; i++) {
            for (var j=0; j<i; j++) {
                var skipper = 0;
                while (distance(points[i], points[j]) < MINDIST)  {
                    points[i] = randPoint();
                    j=0;
                    skipper ++;
                    if (skipper > 15) {
                        j=i;
                        break;
                    }
                }
            }
        }
        return points;
    }

    function generateLinks(points) {
        /*points :: an array of Points
        Selects all points with distance less than MAXLINK to
        draw links between.*/
        var links = [];
        for (var i=0; i<points.length; i++) {
            for (var j=0; j<i; j++) {
                if (distance(points[i], points[j]) < MAXLINK) {
                    links.push([points[i], points[j]]);
                }
            }
        }
        return links;
    }

    function drawLines(links) {
        /*links :: an array of two-element arrays of Points
        Draws thick grey lines between all points connected by links.*/
        for (var i=0; i<links.length; i++) {
            a = links[i][0];
            b = links[i][1];
            ctx.strokeStyle = BLACK;
            ctx.lineWidth = 5;
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
        }
    }

    function drawCirclesAt(points) {
        /*Draw circles of radius RADIUS at all input points.
        Uses preset color.
        points :: an array of Point objects (Point: has x, y attributes)*/
        for (var i=0; i<points.length; i++) {
            var point = points[i];
            ctx.fillStyle = GREY;
            drawCircleAt(point);
            ctx.fillStyle = WHITE;
        }
    }


    function drawCircleAt(point) {
        /*Draws a circle of radius RADIUS at the input point.
        Uses preset color.
        point :: a Point object (has x, y attributes)*/
        ctx.beginPath();
        ctx.arc(point.x, point.y, RADIUS, 0, 2*Math.PI);
        ctx.fill();
    }

    function getNearestBlob(target, blobs) {
        /*points :: a list of Points
        target :: a Point
        return value :: a Blob, in blobs, closest to target*/
        var mindist = Infinity;
        var bestblob = null;
        for (var i=0; i<blobs.length; i++) {
            var dist = distance(target, blobs[i]);
            console.log("Got distance! "+dist+" to "+blobs[i].name);
            if (dist < mindist) {
                mindist = dist;
                bestblob = blobs[i];
                console.log("Better distance! "+dist+" to "+blobs[i].name);
            }
        }
        return bestblob;
    }

    function setClickColoringHandler(canvas, blobs) {
        canvas.addEventListener("mousedown", function(event) {
            var x = event.pageX;
            var y = event.pageY;
            var target = Point(x,y);
            var blob = getNearestBlob(target, blobs);
            blob.click();
        }, false);
    }

    function Blob(point) {
        this.point = point;
        this.x = point.x;
        this.y = point.y;
        this.neighbors = null;
        this.updateNeighbors = function() {
            this.neighbors = neighborsVia(links)(this.point);
        }
        this.state = 0; //BLACK
        this.NUMSTATES = 4;
        this.click = function() {
            //Increment state mod NUMSTATES
            //...until the state is valid relative to its neighbors
            //At the end, redraw the circle and cease looping.
            this.incrementState();
            while (!this.stateIsValid()) {
                this.incrementState();
            }
            this.redraw();
        }
        this.redraw = function() {
            ctx.fillStyle = WHITE;
            drawCircleAt(this);
            ctx.fillStyle = COLORS[this.state];
            drawCircleAt(this);
        }
        this.stateIsValid = function() {
            if (this.state == 0) {
                return true;
            } else {
                for (var i=0; i<this.neighbors.length; i++) {
                    if (this.neighbors[i].state == this.state) {
                        return false;
                    } else {
                        console.log("Different: "+this.state+", "+this.neighbors[i].state);
                    }
                }
                return true;
            }
        }
        this.incrementState = function() {
            this.state += 1;
            this.state %= this.NUMSTATES;
        }
        
        this.name = blobNameCounter;
        blobNameCounter++;

        return this;
    }

    // Main execution
    var points = generatePoints();

    var blobNameCounter = 0;
    var blobs = points.map(function(i) {return new Blob(i);});
    console.log(points.map(function(i) {return i.x;}));
    console.log(blobs.map(function(i) {return i.name;}));

    var links = generateLinks(blobs);
    blobs.map(function(i) {i.updateNeighbors();})
    drawLines(links);
    drawCirclesAt(points);

    setClickColoringHandler(canvas, blobs);



    // Sandbox!

    //var point = {x:55, y:200};
    //drawCircleAt(point);
    
    /*
    ctx.strokeStyle = "#FF0000";
    ctx.lineWidth = 5;
    ctx.fillRect(10,10,5,5);
    ctx.moveTo(100,100);
    ctx.lineTo(200,200);
    ctx.lineTo(500,200);
    ctx.lineTo(100,100);
    ctx.lineTo(200,800);
    ctx.lineTo(100,100);
    ctx.stroke();
    */
}