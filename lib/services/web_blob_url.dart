import 'dart:typed_data';
import 'dart:html' as html;

String? createObjectUrl(Uint8List bytes, String mimeType) {
	final blob = html.Blob([bytes], mimeType);
	return html.Url.createObjectUrlFromBlob(blob);
}


