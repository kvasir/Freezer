window.onresize = doLayout;
let isLoading = false;

onload = () => {
  const webview = document.querySelector('webview');
  doLayout();

  document.querySelector('#back').onclick = () => {
    webview.goBack();
  };

  document.querySelector('#forward').onclick = () => {
    webview.goForward();
  };

  document.querySelector('#home').onclick = () => {
    navigateTo('http://www.deezer.com/');
  };

  document.querySelector('#reload').onclick = () => {
    if (isLoading) {
      webview.stop();
    } else {
      webview.reload();
    }
  };

  document.querySelector('#reload').addEventListener('webkitAnimationIteration', () => {
    if (!isLoading) {
      document.body.classList.remove('loading');
    }
  });

  document.querySelector('#location-form').onsubmit = e => {
    e.preventDefault();
    navigateTo(document.querySelector('#location').value);
  };

  webview.addEventListener('close', handleExit);
  webview.addEventListener('did-start-loading', handleLoadStart.bind(webview));
  webview.addEventListener('did-stop-loading', handleLoadStop);
  webview.addEventListener('did-fail-load', handleLoadAbort);
  webview.addEventListener('did-get-redirect-request', handleLoadRedirect.bind(webview));
  webview.addEventListener('did-finish-load', handleLoadCommit.bind(webview));

  // Test for the presence of the experimental <webview> zoom and find APIs.
  if (typeof (webview.setZoom) === 'function' &&
      typeof (webview.find) === 'function') {
    let findMatchCase = false;

    document.querySelector('#zoom').onclick = () => {
      if (document.querySelector('#zoom-box').style.display === '-webkit-flex') {
        closeZoomBox();
      } else {
        openZoomBox();
      }
    };

    document.querySelector('#zoom-form').onsubmit = e => {
      e.preventDefault();
      const zoomText = document.forms['zoom-form']['zoom-text'];
      let zoomFactor = Number(zoomText.value);
      if (zoomFactor > 5) {
        zoomText.value = '5';
        zoomFactor = 5;
      } else if (zoomFactor < 0.25) {
        zoomText.value = '0.25';
        zoomFactor = 0.25;
      }
      webview.setZoom(zoomFactor);
    };

    document.querySelector('#zoom-in').onclick = e => {
      e.preventDefault();
      increaseZoom();
    };

    document.querySelector('#zoom-out').onclick = e => {
      e.preventDefault();
      decreaseZoom();
    };

    document.querySelector('#find').onclick = () => {
      if (document.querySelector('#find-box').style.display === 'block') {
        document.querySelector('webview').stopFinding();
        closeFindBox();
      } else {
        openFindBox();
      }
    };

    document.querySelector('#find-text').oninput = () => {
      webview.find(document.forms['find-form']['find-text'].value,
                   {matchCase: findMatchCase});
    };

    document.querySelector('#find-text').onkeydown = e => {
      if (event.ctrlKey && event.keyCode === 13) {
        e.preventDefault();
        webview.stopFinding('activate');
        closeFindBox();
      }
    };

    document.querySelector('#match-case').onclick = e => {
      e.preventDefault();
      findMatchCase = !findMatchCase;
      const matchCase = document.querySelector('#match-case');
      if (findMatchCase) {
        matchCase.style.color = 'blue';
        matchCase.style['font-weight'] = 'bold';
      } else {
        matchCase.style.color = 'black';
        matchCase.style['font-weight'] = '';
      }
      webview.find(document.forms['find-form']['find-text'].value,
                   {matchCase: findMatchCase});
    };

    document.querySelector('#find-backward').onclick = e => {
      e.preventDefault();
      webview.find(document.forms['find-form']['find-text'].value,
                   {backward: true, matchCase: findMatchCase});
    };

    document.querySelector('#find-form').onsubmit = e => {
      e.preventDefault();
      webview.find(document.forms['find-form']['find-text'].value,
                   {matchCase: findMatchCase});
    };

    webview.addEventListener('findupdate', handleFindUpdate);
    window.addEventListener('keydown', handleKeyDown);
  } else {
    const zoom = document.querySelector('#zoom');
    const find = document.querySelector('#find');
    zoom.style.visibility = 'hidden';
    zoom.style.position = 'absolute';
    find.style.visibility = 'hidden';
    find.style.position = 'absolute';
  }
};

function navigateTo(url) {
  resetExitedState();
  document.querySelector('webview').src = url;
}

function doLayout() {
  const controls = document.querySelector('#controls');
  const controlsHeight = controls.offsetHeight;
  const windowWidth = document.documentElement.clientWidth;
  const windowHeight = document.documentElement.clientHeight;
  const webviewWidth = windowWidth;
  const webviewHeight = windowHeight - controlsHeight;

  const webview = document.querySelector('webview');
  const sadWebview = document.querySelector('#sad-webview');

  webview.style.width = `${webviewWidth}px`;
  webview.style.height = `${webviewHeight}px`;

  sadWebview.style.width = `${webviewWidth}px`;
  sadWebview.style.height = `${webviewHeight * 2 / 3}px`;
  sadWebview.style.paddingTop = `${webviewHeight / 3}px`;
}

function handleExit(event) {
  console.log(event.type);
  document.body.classList.add('exited');

  if (event.type === 'abnormal') {
    document.body.classList.add('crashed');
  } else if (event.type === 'killed') {
    document.body.classList.add('killed');
  }
}

function resetExitedState() {
  document.body.classList.remove('exited');
  document.body.classList.remove('crashed');
  document.body.classList.remove('killed');
}

function handleFindUpdate(event) {
  const findResults = document.querySelector('#find-results');
  if (event.searchText === '') {
    findResults.innerText = '';
  } else {
    findResults.innerText = `${event.activeMatchOrdinal} of ${event.numberOfMatches}`;
  }

  // Ensure that the find box does not obscure the active match.
  if (event.finalUpdate && !event.canceled) {
    const findBox = document.querySelector('#find-box');
    const findBoxRect = findBox.getBoundingClientRect();

    findBox.style.left = '';
    findBox.style.opacity = '';

    if (findBoxObscuresActiveMatch(findBoxRect, event.selectionRect)) {
      // Move the find box out of the way if there is room on the screen, or
      // make it semi-transparent otherwise.
      const potentialLeft = event.selectionRect.left - findBoxRect.width - 10;
      if (potentialLeft >= 5) {
        findBox.style.left = `${potentialLeft}px`;
      } else {
        findBox.style.opacity = '0.5';
      }
    }
  }
}

function findBoxObscuresActiveMatch(findBoxRect, matchRect) {
  return findBoxRect.left < matchRect.left + matchRect.width &&
      findBoxRect.right > matchRect.left &&
      findBoxRect.top < matchRect.top + matchRect.height &&
      findBoxRect.bottom > matchRect.top;
}

function handleKeyDown(event) {
  event.preventDefault();

  const handler = {
    70: () => openFindBox(),
    107: () => increaseZoom(),
    187: () => increaseZoom(),
    109: () => decreaseZoom(),
    189: () => decreaseZoom()
  };

  if (event.ctrlKey) {
    handler[event.ctrlKey.toString()]();
  }
}

function setLocation(webview) {
  document.querySelector('#location').value = webview.getUrl();
  document.title = webview.getTitle();
}

function handleLoadCommit() {
  resetExitedState();

  setLocation(this);
  // document.querySelector('#location').value = this.getUrl();

  // document.querySelector('#back').disabled = !this.canGoBack();
  // document.querySelector('#forward').disabled = !this.canGoForward();
  closeBoxes();
}

function handleLoadStart() {
  document.body.classList.add('loading');
  isLoading = true;

  resetExitedState();

  // document.querySelector('#location').value = event.url;

  setLocation(this);
  // document.querySelector('#location').value = this.getUrl();
}

function handleLoadStop() {
  // We don't remove the loading class immediately, instead we let the animation
  // finish, so that the spinner doesn't jerkily reset back to the 0 position.
  isLoading = false;
}

function handleLoadAbort(event) {
  console.log('LoadAbort');
  console.log('  url: ', event.url);
  console.log('  isTopLevel: ', event.isTopLevel);
  console.log('  type: ', event.type);
}

function handleLoadRedirect() {
  resetExitedState();
  // document.querySelector('#location').value = event.newUrl;

  setLocation(this);
  // document.querySelector('#location').value = this.getUrl();
}

function getNextPresetZoom(zoomFactor) {
  const preset = [0.25, 0.33, 0.5, 0.67, 0.75, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2,
                2.5, 3, 4, 5];
  let low = 0;
  let high = preset.length - 1;
  let mid;
  while (high - low > 1) {
    mid = Math.floor((high + low) / 2);
    if (preset[mid] < zoomFactor) {
      low = mid;
    } else if (preset[mid] > zoomFactor) {
      high = mid;
    } else {
      return {low: preset[mid - 1], high: preset[mid + 1]};
    }
  }
  return {low: preset[low], high: preset[high]};
}

function increaseZoom() {
  const webview = document.querySelector('webview');
  webview.getZoom(zoomFactor => {
    const nextHigherZoom = getNextPresetZoom(zoomFactor).high;
    webview.setZoom(nextHigherZoom);
    document.forms['zoom-form']['zoom-text'].value = nextHigherZoom.toString();
  });
}

function decreaseZoom() {
  const webview = document.querySelector('webview');

  webview.getZoom(zoomFactor => {
    const nextLowerZoom = getNextPresetZoom(zoomFactor).low;
    webview.setZoom(nextLowerZoom);
    document.forms['zoom-form']['zoom-text'].value = nextLowerZoom.toString();
  });
}

function openZoomBox() {
  document.querySelector('webview').getZoom(zoomFactor => {
    const zoomText = document.forms['zoom-form']['zoom-text'];
    zoomText.value = Number(zoomFactor.toFixed(6)).toString();
    document.querySelector('#zoom-box').style.display = '-webkit-flex';
    zoomText.select();
  });
}

function closeZoomBox() {
  document.querySelector('#zoom-box').style.display = 'none';
}

function openFindBox() {
  document.querySelector('#find-box').style.display = 'block';
  document.forms['find-form']['find-text'].select();
}

function closeFindBox() {
  const findBox = document.querySelector('#find-box');
  findBox.style.display = 'none';
  findBox.style.left = '';
  findBox.style.opacity = '';
  document.querySelector('#find-results').innerText = '';
}

function closeBoxes() {
  closeZoomBox();
  closeFindBox();
}
