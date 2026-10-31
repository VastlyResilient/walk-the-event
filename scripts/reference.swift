import AVFoundation; import AppKit
let u=URL(fileURLWithPath:"/Users/bobby/walk-the-event/input/videos/downstairs.mp4");let a=AVAsset(url:u);let g=AVAssetImageGenerator(asset:a);g.appliesPreferredTrackTransform=true
if let cg=try? g.copyCGImage(at:CMTime(seconds:16.5,preferredTimescale:600),actualTime:nil){let r=NSBitmapImageRep(cgImage:cg);try! r.representation(using:.png,properties:[:])!.write(to:URL(fileURLWithPath:"/Users/bobby/walk-the-event/qa/color/native-16.5.png"))}
