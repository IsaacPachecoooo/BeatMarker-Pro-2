
import { Marker, ExportFormat } from '../types';
import { formatTime } from './audioEngine';

export const exportMarkers = (markers: Marker[], format: ExportFormat, fileName: string) => {
  let content = '';
  let mimeType = 'text/plain';
  let extension = 'txt';

  switch (format) {
    case ExportFormat.PREMIERE_CSV:
      // Premiere Pro Marker CSV Header
      content = 'Name,In,Description,Marker Type\n';
      markers.forEach(m => {
        // Premiere CSV uses HH:MM:SS:FF or seconds
        // Using seconds is safest for simple imports
        content += `"${m.label}","${m.time}","Beat detected by BeatMarker Pro","Comment"\n`;
      });
      mimeType = 'text/csv';
      extension = 'csv';
      break;

    case ExportFormat.AFTER_EFFECTS_JS:
      // A script to be executed in After Effects to apply markers to a selected layer
      content = `(function() {
  var layer = app.project.activeItem.selectedLayers[0];
  if (!layer) { alert("Select a layer first!"); return; }
  var markers = ${JSON.stringify(markers)};
  app.beginUndoGroup("Apply Beat Markers");
  for (var i = 0; i < markers.length; i++) {
    var myMarker = new MarkerValue(markers[i].label);
    layer.property("Marker").setValueAtTime(markers[i].time, myMarker);
  }
  app.endUndoGroup();
})();`;
      mimeType = 'application/javascript';
      extension = 'jsx';
      break;

    case ExportFormat.FINAL_CUT_XML:
      content = `<?xml version="1.0" encoding="UTF-8"?>
<fcpxml version="1.8">
  <resources>
    <format id="r1" name="FFVideoFormat1080p24" frameDuration="100/2400s"/>
  </resources>
  <library>
    <event name="BeatMarker Export">
      <project name="Beat Markers">
        <sequence format="r1" duration="3600s">
          <spine>
            ${markers.map(m => `<marker start="${m.time}s" duration="0s" value="${m.label}" />`).join('\n            ')}
          </spine>
        </sequence>
      </project>
    </event>
  </library>
</fcpxml>`;
      mimeType = 'application/xml';
      extension = 'xml';
      break;
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName.split('.')[0]}_markers.${extension}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
