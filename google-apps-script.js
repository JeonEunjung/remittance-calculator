function doPost(e) {
  try {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var data = JSON.parse(e.postData.contents);

    Logger.log('받은 데이터: ' + JSON.stringify(data));

    // DELETE 요청 처리
    if (data.action === 'delete' && data.id) {
      Logger.log('삭제 요청 - ID: ' + data.id);

      // type에 따라 시트 선택
      var sheetName = (data.type === 'currency') ? 'Currency' : 'Funnel';
      var sheet = spreadsheet.getSheetByName(sheetName);

      if (!sheet) {
        return ContentService.createTextOutput(JSON.stringify({
          'status': 'error',
          'message': '시트를 찾을 수 없습니다: ' + sheetName
        })).setMimeType(ContentService.MimeType.JSON);
      }

      var allData = sheet.getDataRange().getValues();
      Logger.log('전체 행 수: ' + allData.length);

      // 해당 ID의 행 찾기 (헤더 제외)
      for (var i = 1; i < allData.length; i++) {
        Logger.log('행 ' + i + ' ID: ' + allData[i][0]);

        if (allData[i][0] === data.id) {
          Logger.log('일치하는 행 발견: ' + (i + 1));
          sheet.deleteRow(i + 1); // 스프레드시트는 1부터 시작
          return ContentService.createTextOutput(JSON.stringify({
            'status': 'success',
            'message': '데이터가 삭제되었습니다'
          })).setMimeType(ContentService.MimeType.JSON);
        }
      }

      Logger.log('일치하는 ID를 찾지 못함');
      return ContentService.createTextOutput(JSON.stringify({
        'status': 'error',
        'message': '해당 ID의 데이터를 찾을 수 없습니다: ' + data.id
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 데이터 저장 - type에 따라 다른 시트에 저장
    Logger.log('데이터 저장 요청 - type: ' + data.type);

    if (data.type === 'currency') {
      // Currency 시트에 통화별 데이터 저장
      var sheet = spreadsheet.getSheetByName('Currency');
      if (!sheet) {
        sheet = spreadsheet.insertSheet('Currency');
        // 헤더 추가
        sheet.appendRow([
          'id', 'type', 'date', 'label', 'currencyStartUsers',
          'jpyRatio', 'jpyRate', 'usdRatio', 'usdRate',
          'eurRatio', 'eurRate', 'audRatio', 'audRate',
          'cadRatio', 'cadRate', 'gbpRatio', 'gbpRate',
          'weightedRate', 'completedUsers', 'avgAmount', 'feeRate', 'savedAt'
        ]);
      }

      var rowData = [
        data.id,
        data.type,
        data.date,
        data.label,
        data.currencyStartUsers,
        data.jpyRatio,
        data.jpyRate,
        data.usdRatio,
        data.usdRate,
        data.eurRatio,
        data.eurRate,
        data.audRatio,
        data.audRate,
        data.cadRatio,
        data.cadRate,
        data.gbpRatio,
        data.gbpRate,
        data.weightedRate,
        data.completedUsers,
        data.avgAmount,
        data.feeRate,
        data.savedAt
      ];
    } else {
      // Funnel 시트에 퍼널 데이터 저장
      var sheet = spreadsheet.getSheetByName('Funnel');
      if (!sheet) {
        sheet = spreadsheet.insertSheet('Funnel');
        // 헤더 추가
        sheet.appendRow([
          'id', 'type', 'date', 'label', 'signups',
          'kycRate', 'startRate', 'completeRate', 'depositRate',
          'remitRate', 'overallRate', 'avgAmount', 'feeRate', 'savedAt'
        ]);
      }

      var rowData = [
        data.id,
        data.type || 'funnel',
        data.date,
        data.label,
        data.signups,
        data.kycRate,
        data.startRate,
        data.completeRate,
        data.depositRate,
        data.remitRate,
        data.overallRate,
        data.avgAmount,
        data.feeRate,
        data.savedAt
      ];
    }

    sheet.appendRow(rowData);
    Logger.log('데이터 저장 완료');

    return ContentService.createTextOutput(JSON.stringify({
      'status': 'success',
      'message': '데이터가 저장되었습니다'
    })).setMimeType(ContentService.MimeType.JSON);

  } catch(error) {
    Logger.log('에러 발생: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      'status': 'error',
      'message': error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var jsonData = [];

    // Funnel 시트에서 데이터 읽기
    var funnelSheet = spreadsheet.getSheetByName('Funnel');
    if (funnelSheet) {
      var funnelData = funnelSheet.getDataRange().getValues();
      // 헤더 제외하고 데이터 반환
      for (var i = 1; i < funnelData.length; i++) {
        jsonData.push({
          id: funnelData[i][0],
          type: funnelData[i][1] || 'funnel',
          date: funnelData[i][2],
          label: funnelData[i][3],
          signups: funnelData[i][4],
          kycRate: funnelData[i][5],
          startRate: funnelData[i][6],
          completeRate: funnelData[i][7],
          depositRate: funnelData[i][8],
          remitRate: funnelData[i][9],
          overallRate: funnelData[i][10],
          avgAmount: funnelData[i][11],
          feeRate: funnelData[i][12],
          savedAt: funnelData[i][13]
        });
      }
    }

    // Currency 시트에서 데이터 읽기
    var currencySheet = spreadsheet.getSheetByName('Currency');
    if (currencySheet) {
      var currencyData = currencySheet.getDataRange().getValues();
      // 헤더 제외하고 데이터 반환
      for (var i = 1; i < currencyData.length; i++) {
        jsonData.push({
          id: currencyData[i][0],
          type: currencyData[i][1],
          date: currencyData[i][2],
          label: currencyData[i][3],
          currencyStartUsers: currencyData[i][4],
          jpyRatio: currencyData[i][5],
          jpyRate: currencyData[i][6],
          usdRatio: currencyData[i][7],
          usdRate: currencyData[i][8],
          eurRatio: currencyData[i][9],
          eurRate: currencyData[i][10],
          audRatio: currencyData[i][11],
          audRate: currencyData[i][12],
          cadRatio: currencyData[i][13],
          cadRate: currencyData[i][14],
          gbpRatio: currencyData[i][15],
          gbpRate: currencyData[i][16],
          weightedRate: currencyData[i][17],
          completedUsers: currencyData[i][18],
          avgAmount: currencyData[i][19],
          feeRate: currencyData[i][20],
          savedAt: currencyData[i][21]
        });
      }
    }

    return ContentService.createTextOutput(JSON.stringify(jsonData))
      .setMimeType(ContentService.MimeType.JSON);

  } catch(error) {
    return ContentService.createTextOutput(JSON.stringify({
      'status': 'error',
      'message': error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
