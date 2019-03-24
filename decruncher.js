/*  Decruncher by DrSnuggles
  Amiga copperbars style canvas for popular javascript depackers
  It's not just random colors
*/

"use strict";

var Decruncher = (function() {
  //
  // Init
  //
  var my = {            // holds all public available functions/properties
    version : "0.4",    // version
    packer : "jszip",   // used depacking library
    visualOutput : true,// enable/disable the whole point of this lib, never set it to false !!! ;)
    lines : 256,        // 256 amiga lines
    background : true,  // background or foreground
    fullscreen : true,  // fullscreen or border only
  },
  debug = false,        // duration times will still be displayed in console
  raf,                  // requestAnimationFrame, needed for cancel
  ctx,                  // canvas 2d context so i do not need to get this every frame
  loadedPackers = [],   // already loaded packers, do not load them twice
  /*
  packers_local = {     // local resources for the supported packers
    "zipjs" : "packers/zip.js/zip.js",
    "jszip" : "packers/jszip.js",
    "jsx" : "packers/jsxcompressor.min.js",
    "pako" : "packers/pako_inflate.js",
    "lh4" : "packers/lh4.js",
  },
  */
  packers = {           // CDN resources for the supported packers
    "jszip" : "//gitcdn.xyz/repo/Stuk/jszip/master/dist/jszip.min.js",
    "zipjs" : "packers/zip.js/zip.js",
    "jsx" : "//gitcdn.xyz/repo/jsxgraph/jsxgraph/master/JSXCompressor/jsxcompressor.min.js",
    "pako" : "//gitcdn.xyz/repo/nodeca/pako/master/dist/pako_inflate.min.js",
    "lh4" : "//gitcdn.xyz/repo/erlandranvinge/lh4.js/master/lh4.js",
  },
  packedData,           // Uint8Array of packed data, used to get line colors
  currentPos,           // position in ^^ for next frame
  CDN = "//cdn.jsdelivr.net/gh/DrSnuggles/Decruncher/";
  CDN = "";             // use local version

  //
  // Private
  //
  function log(t) {
    // log to console only when debug=true
    if (debug) console.log(t);
  };
  function startCopperbars(background, fullscreen, lines) {
    var canvas = document.createElement('canvas');
    canvas.id = 'copperbars';
    var zIndex = background ? -604 : 604;
    canvas.style = 'position:absolute;top:0;left:0;width:100%;height:100%;z-index:'+ zIndex +';';
    canvas.height = lines;
    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d');
    currentPos = 0;
    raf = requestAnimationFrame(function(){renderCopperbars(fullscreen, lines)});
  };
  function stopCopperbars() {
    document.body.removeChild(copperbars);
    cancelAnimationFrame(raf);
  };
  function renderCopperbars(fullscreen, lines) {
    log("renderCopperbars: "+ currentPos);
    for (var y = 0; (y < lines && currentPos+y+2 < packedData.length) ; y++) {
      ctx.beginPath();
      ctx.strokeStyle = "rgb("+ packedData[currentPos+y] +", "+ packedData[currentPos+y+1] +", "+ packedData[currentPos+y+2] +")";
      if (fullscreen || y < lines*0.05 || y > lines*0.95){
        ctx.moveTo(0, y);
        ctx.lineTo(300, y);
      } else {
        ctx.moveTo(0, y);
        ctx.lineTo(10, y);
        ctx.moveTo(290, y);
        ctx.lineTo(300, y);
      }
      currentPos += 3;
      ctx.stroke();
    }
    // and again...
    raf = requestAnimationFrame(function(){renderCopperbars(fullscreen, lines)});
  };
  function addScript(src, cb) {
    console.time("addScript "+src);
    var script = document.createElement("script");
    script.onload = function(){
      console.timeEnd("addScript "+src);
      if (cb) cb();
    };
    script.src = src;
    document.head.appendChild(script);
  };
  function xhr(src, cb, responseType) {
    console.time("XHR load ("+responseType+") "+src);
    var xhr = new XMLHttpRequest();
    xhr.open("GET", src, true);
    if (responseType === "binary") {
      xhr.overrideMimeType('text/plain; charset=x-user-defined');
    } else {
      xhr.responseType = responseType;
    }
    xhr.onreadystatechange = function(){
      if (this.readyState == 4 && this.status == 200){
        console.timeEnd("XHR load ("+responseType+") "+src);
        if (responseType === "" || responseType === "text" || responseType === "binary"){
          //log(this.responseText);
          cb(this.responseText);
        } else {
          //log(this.response);
          cb(this.response);
        }
      }
    };
    /*
    xhr.onprogress = function(e){
      if (e.lengthComputable) {
        var percentage = Math.round((e.loaded/e.total)*100);
        log("percent " + percentage + '%' );
      } else {
        log("not computable"); // but i have the length in allmods.txt
      }
    };
    */
    xhr.send();
  };
  function checkPacker(packer, cb) {
    // check if we need to load the lib
    if (!loadedPackers.includes(packer)) {
      addScript(CDN+packers[packer], function(){
        log("checkPacker had to load: "+ packer);
        loadedPackers.push(packer);
        if (cb) return cb();
      });
    } else {
      // already loaded
      if (cb) return cb();
    }
  };
  function dePacker(url, packer, background, fullscreen, lines, cb) {
    switch (packer){
      case "zipjs":
      zip.workerScriptsPath = document.location.href + "packers/zip.js/";
      // use a BlobReader to read the zip from a Blob object
      xhr(url, function(data){
        if (my.visualOutput) {
          packedData = new Uint8Array(data);
        }
        // convert Uint8Array to Blob
        var blob = Uint82Blob(data);
        zip.createReader(new zip.BlobReader(blob), function(reader) {

          // get all entries from the zip
          reader.getEntries(function(entries) {
            if (entries.length) {

              console.time("Decrunch single file");
              if (my.visualOutput) {
                startCopperbars(background, fullscreen, lines);
              }

              // get first entry content as text
              entries[0].getData(new zip.TextWriter(), function(text) {
                // text contains the entry data as a String
                console.timeEnd("Decrunch single file");
                if (my.visualOutput) {
                  stopCopperbars();
                }
                if (cb) cb(text);

                // close the zip reader
                reader.close(function() {
                  // onclose callback
                });

              }, function(current, total) {
                // onprogress callback
              });
            }
          });
        }, function(error) {
          // onerror callback
        });
      }, "arraybuffer");
      break;
      case "jszip":
        xhr(url, function(data){
          if (my.visualOutput) {
            packedData = bin2ab(data);
          }
          JSZip.loadAsync(data).then(function (d) {
            for (var i in d.files) {
              //if (i === "allmods.txt") {

                console.time("Decrunch single file");
                if (my.visualOutput) {
                  startCopperbars(background, fullscreen, lines);
                }

                d.files[i].async("string").then(function (txt){

                  console.timeEnd("Decrunch single file");
                  if (my.visualOutput) {
                    stopCopperbars();
                  }
                  if (cb) cb(txt);

                }, function (err){
                  console.error("err:",err);
                });
                break;
              //} // if allmods.txt
              break; // just the first file
            } // for files in zip

          });
        }, "binary");
        break;
      case "pako":
        // no file management here. just for gzipped strings
        xhr(url, function(data){
          data = new Uint8Array(data);
          ret = pako.inflate(data);
        }, "blob");
        break;
      case "jsx":
        // no file management here. just for gzipped strings
        xhr(url, function(data){
          ret = JXG.decompress(btoa(data));
        }, "arraybuffer");
        break;
      case "lh4":
        break;
      default:
    }
  };

  //
  // converter helpers
  //
  // https://www.html5rocks.com/de/tutorials/file/xhr2/
  /*
  function bin2Uint8(data) {
    // binary --> UInt8Array SLOW !!!!
    var bytes = Object.keys(data).length;
    var ret = new Uint8Array(bytes);
    for(var i = 0; i < bytes; i++) {
      ret[i] = data[i].charCodeAt(0);
    }
    return ret;
  };
  function blob2Uint8(data) {
    // blob -> UInt8
    var ret;
    var fileReader = new FileReader();
    fileReader.onload = function(event) {
      ret = new Uint8Array(event.target.result);
      return ret; // lol too late.. and i dont care
    };
    fileReader.readAsArrayBuffer(blob);
  };
  function Uint82bin(data) {
    // https://gist.github.com/getify/7325764
    // ^^ got more uint8 conversions
    var len = data.length, ret = "";
    for (var i = 0; i < len; i++) {
    ret += String.fromCharCode(data[i]);
  }
  return ret;
  };
  // https://stackoverflow.com/questions/16363419/how-to-get-binary-string-from-arraybuffer
  function ArrayBufferToString(buffer) {
    return BinaryToString(String.fromCharCode.apply(null, Array.prototype.slice.apply(new Uint8Array(buffer))));
  };
  function StringToArrayBuffer(string) {
    return StringToUint8Array(string).buffer;
  };
  function BinaryToString(binary) {
    var error;
    try {
      return decodeURIComponent(escape(binary));
    } catch (_error) {
      error = _error;
      if (error instanceof URIError) {
        return binary;
      } else {
        throw error;
      }
    }
  };
  function StringToBinary(string) {
    var chars, code, i, isUCS2, len, _i;
    len = string.length;
    chars = [];
    isUCS2 = false;
    for (i = _i = 0; 0 <= len ? _i < len : _i > len; i = 0 <= len ? ++_i : --_i) {
      code = String.prototype.charCodeAt.call(string, i);
      if (code > 255) {
        isUCS2 = true;
        chars = null;
        break;
      } else {
        chars.push(code);
      }
    }
    if (isUCS2 === true) {
      return unescape(encodeURIComponent(string));
    } else {
      return String.fromCharCode.apply(null, Array.prototype.slice.apply(chars));
    }
  };
  function StringToUint8Array(string) {
    var binary, binLen, buffer, chars, i, _i;
    binary = StringToBinary(string);
    binLen = binary.length;
    buffer = new ArrayBuffer(binLen);
    chars  = new Uint8Array(buffer);
    for (i = _i = 0; 0 <= binLen ? _i < binLen : _i > binLen; i = 0 <= binLen ? ++_i : --_i) {
      chars[i] = String.prototype.charCodeAt.call(binary, i);
    }
    return chars;
  };
  function ab2str_old(buf) {
    // https://developers.google.com/web/updates/2012/06/How-to-convert-ArrayBuffer-to-and-from-String
    return String.fromCharCode.apply(null, new Uint16Array(buf));
  };
  // https://stackoverflow.com/questions/6965107/converting-between-strings-and-arraybuffers
  function ab2str(data) {
  var enc = new TextDecoder("utf-8");
  return enc.decode(data);
  };
  */
  function Uint82Blob(data) {
    // https://stackoverflow.com/questions/44147912/arraybuffer-to-blob-conversion
    // https://developers.google.com/web/updates/2012/06/Don-t-Build-Blobs-Construct-Them
    return new Blob([new Uint8Array(data)]);
  };
  function bin2ab(data) {
    // much faster than bin2uint8
    var enc = new TextEncoder();  // always utf-8
    return enc.encode(data);
  };

  //
  // Public
  //
  my.depackURL = function (url, cb) {
    // arguments are just use for this single request not changing the default
    var packer = this.packer;
    var background = this.background;
    var fullscreen = this.fullscreen;
    var lines = this.lines;
    if (arguments[2] !== undefined) packer = arguments[2];
    if (arguments[3] !== undefined) background = arguments[3];
    if (arguments[4] !== undefined) fullscreen = arguments[4];
    if (arguments[5] !== undefined) lines = arguments[5];
    log("depackURL ("+ packer +"): "+ url);
    checkPacker(packer, function(){
      dePacker(url, packer, background, fullscreen, lines, cb);
    });
  };

  //
  // Exit
  //
  return my;
})();
