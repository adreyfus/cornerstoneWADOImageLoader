import $ from 'jquery';
import { getOptions } from './options';
import * as cornerstone from 'cornerstone-core';

function xhrRequest (url, imageId, headers = {}) {
  const deferred = $.Deferred();
  const options = getOptions();

  // Make the request for the DICOM P10 SOP Instance
  const xhr = new XMLHttpRequest();

  xhr.open('get', url, true);
  xhr.responseType = 'arraybuffer';
  options.beforeSend(xhr);
  Object.keys(headers).forEach(function (key) {
    xhr.setRequestHeader(key, headers[key]);
  });

  // Event triggered when downloading an image starts
  xhr.onloadstart = function () {
    $(cornerstone.events).trigger('CornerstoneImageLoadStart', {
      url
    });
  };

  // Event triggered when downloading an image ends
  xhr.onloadend = function () {
    $(cornerstone.events).trigger('CornerstoneImageLoadEnd', {
      url
    });
  };

  // handle response data
  xhr.onreadystatechange = function () {
    // TODO: consider sending out progress messages here as we receive the pixel data
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        deferred.resolve(xhr.response, xhr);
      } else {
        // request failed, reject the deferred
        deferred.reject(xhr);
      }
    }
  };

  // Event triggered when downloading an image progresses
  xhr.onprogress = function (oProgress) {
    // console.log('progress:',oProgress)

    const loaded = oProgress.loaded; // evt.loaded the bytes browser receive
    let total;
    let percentComplete;

    if (oProgress.lengthComputable) {
      total = oProgress.total; // evt.total the total bytes seted by the header
      percentComplete = Math.round((loaded / total) * 100);
    }

    $(cornerstone.events).trigger('CornerstoneImageLoadProgress', {
      url,
      imageId,
      loaded,
      total,
      percentComplete
    });
  };

  xhr.send();

  return deferred.promise();
}

export default xhrRequest;