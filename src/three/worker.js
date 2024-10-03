/** @file /src/scripts/worker.ts */

addEventListener('message', (event) => {
  const { action } = event.data;

  console.log('action', action);
  switch (action) {
      case 'init':
          await initializeScene(event.data);
          break;
      case 'resume':
          isRendering = true;
          if (isSceneInitialized) render();
          break;
      case 'stop':
          isRendering = false;
          break;
      case 'updateViewport':
          updateViewportData(event.data);
          break;
  }
    postMessage(event.data);
});

async function initializeScene(data) {
    console.log('data.container', data.container);
}
