(function(){

    'use strict'; //browser does complain about bad coding
  

  
    angular.module('DoorPlate-Wizard', [])
    .controller('PlateController', PlateController)
    .service('PlateService', PlateService);
  
    PlateController.$inject = ['PlateService'];
    function PlateController(PlateService){
      let maList = this;
      const options = { year: '2-digit', month: '2-digit', day: '2-digit' };
  
      maList.Filename = '';
      maList.today = new Date().toLocaleDateString('de-DE', options);

      maList.items = {rooms: []};

      $(document).ready(function() {
        $('#list').bind('change', handleDialog);
      });

      function handleDialog(event) {
        
        let files = event.target.files;
        let file = files[0];
        

        let reader = new FileReader();
        reader.readAsText(file);
        reader.onload = function(event){
          let csv = event.target.result;          
          let data = $.csv.toObjects(csv, {separator: ";"});
          
          let rooms = data.map(x => x.room);
          let unique_rooms = rooms.filter((item, i, ar) => ar.indexOf(item) === i);

          unique_rooms.forEach(function(element, index){            
            let persons = data.filter(x => x.room === element); 
            //console.log(persons);
            maList.items.rooms.push({
              "room": element,
              "persons": persons
            });            
          });              
        }
      }
  
      //console.log(maList.items);
      maList.readAndConvertFile = function(){
        
      }
  
  
       
      // maList.items = {
      //   "rooms": [
      //   {
      //       "room": "SB342",
      //       "persons": [
      //           {"name": "DukSoftware", "oe": "NMF32", "function": "f2"},
      //           {"name": "DukSoftware2", "oe": "NPB2", "function": ""},
      //           {"name": "DukSoftware3", "oe": "NFC3", "function": "f3"}
      //       ]
      //   },
      //   {
      //       "room": "Room3",
      //       "persons": [
      //           {"name": "Tingerlee", "oe": "NMF1", "function": ""},
      //           {"name": "Tingerloo", "oe": "NMF13", "function": "f4"}
      //       ]
      //   }
      // ]}

  
      maList.generateDOCX = function(){
        //console.log(maList.items);
        var docs = document.getElementById('template');
        var reader = new FileReader();
        if (docs.files.length === 0) {
           alert("No files selected")
        }
        reader.readAsBinaryString(docs.files.item(0));

        reader.onerror = function (evt) {
           console.log("error reading file", evt);
           alert("error reading file" + evt)
        }
        reader.onload = function (evt) {
           const content = evt.target.result;
           var zip = new PizZip(content);
           var doc;
           try {
               doc=new window.docxtemplater(zip);
           } catch(error) {
               // Catch compilation errors (errors caused by the compilation of the template : misplaced tags)
               errorHandler(error);
           }

           doc.setData(maList.items);
           try {
               // render the document (replace all occurences of {first_name} by John, {last_name} by Doe, ...)
               doc.render();
           }
           catch (error) {
               // Catch rendering errors (errors relating to the rendering of the template : angularParser throws an error)
               errorHandler(error);
           }

           var out=doc.getZip().generate({
              type:"blob",
              mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
           }) //Output the document using Data-URI
           saveAs(out,"output.docx")
        };        
      }; 
  
    }
  
  
  
    function PlateService(){
      let service = this;
      let roomList = [];
  
      service.addReportItem = function(znr){
        //console.log(reportItems.length + " length of items before");
        //let relativeTime = 0;
        let id = 1;
        let created = new Date();
        let vt = '';
        let start = '';
        let i_start = '';
        let end = '';
        let i_end = '';
        let difference_sec = 0;
        let show_st = 1;
        let show_en = 0;
        let show_sp = 0;
        if(reportItems.length > 0){
          // in seconds
          //relativeTime = Math.floor(time/1000) - Math.floor(reportItems[reportItems.length - 1].timestamp / 1000);
          id = reportItems[reportItems.length - 1].id + 1;
        }
        //console.log(relativeTime + " relativeTime");
        //console.log(time + " time");
        let date_created = created.toLocaleDateString();
        let timeclock_created = created.toLocaleTimeString();
  
        reportItems.push({id: id, znr: znr, vt: vt, start: start, end: end, show_st: show_st, show_en: show_en, show_sp: show_sp,
          created: created, date_created: date_created, timeclock_created: timeclock_created, 
          istart: i_start, iend: i_end, difference_sec: difference_sec});
        //console.log(reportItems.length + " length of items after");
        //console.log(reportItems);
  
      };
  
      service.getReportItems = function(){
        //console.log(reportItems);
        return reportItems;
      };
  
      service.getDateTime = function(){
        let firstItem = this.getReportItems()[0];
        let ymd = firstItem.created.getFullYear() + "-" + (1+ firstItem.created.getMonth()).toLocaleString(undefined, {minimumIntegerDigits: 2}) + "-" + firstItem.created.getDate().toLocaleString(undefined, {minimumIntegerDigits: 2});
        return (ymd + '_' + firstItem.timeclock_created);
      };
  
      service.downloadCSV = function(args) {
        let data, filename, link;
        let tempReport = Object.create(reportItems);
        tempReport.push({id: '', znr: '', vt: '', start: '', end: '', created: '', date_created: '', timeclock_created: '', istart: '', iend: '', difference_sec: ''});
  
        let csv = convertArrayOfObjectsToCSV({
            data: tempReport
        });
  
        //console.log(csv + " is generated");
  
        if (csv == null) return;
  
        filename = args.filename || 'export.csv';
  
        if (!csv.match(/^data:text\/csv/i)) {
            csv = 'data:text/csv;charset=utf-8,' + csv;
        }
        data = encodeURI(csv);
  
        link = document.createElement('a');
        link.setAttribute('href', data);
        link.setAttribute('download', filename);
        link.click();
      };
  
      service.remove = function(id){
        let index = reportItems.findIndex(x => x.id== id);
        let item = reportItems[index];
        console.log(item);
        reportItems.splice(index, 1);
      };
  
      service.editZNr = function(id, znr){
        let index = reportItems.findIndex(x => x.id== id);
        reportItems[index].znr = znr;
      };
  
      service.setVT = function(id, vt){
        let index = reportItems.findIndex(x => x.id== id);
        reportItems[index].vt = vt;
      };
  
      service.setStart = function(id, time){
        let index = reportItems.findIndex(x => x.id== id);
        reportItems[index].start = time.toLocaleTimeString();
        reportItems[index].istart = time;
        reportItems[index].show_st = 0;
        reportItems[index].show_en = 1;
        reportItems[index].show_sp = 1;
      };
  
      service.setEnd = function(id, time){
        let index = reportItems.findIndex(x => x.id== id);
        reportItems[index].end = time.toLocaleTimeString();
        reportItems[index].iend = time;
        //console.log(time/1000 - reportItems[index].istart/1000);
        reportItems[index].difference_sec = Math.floor(time/1000) - Math.floor(reportItems[index].istart/1000);
        reportItems[index].show_en = 0;
        reportItems[index].show_sp = 0;
      };
    }
  
    
  
  })();