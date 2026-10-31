import Foundation
import AVFoundation
import Vision
import CoreImage
import ImageIO

struct FaceBox: Codable { let x: Double; let y: Double; let w: Double; let h: Double; let confidence: Double }
struct FrameFaces: Codable { let t: Double; let faces: [FaceBox] }

let args = CommandLine.arguments
guard args.count >= 3 else { print("usage: face_detect <video> <out.json> [fps] [start] [end]"); exit(2) }
let url = URL(fileURLWithPath: args[1])
let outURL = URL(fileURLWithPath: args[2])
let sampleFPS = args.count > 3 ? Double(args[3]) ?? 12.0 : 12.0
let startT = args.count > 4 ? Double(args[4]) ?? 0.0 : 0.0
let endT = args.count > 5 ? Double(args[5]) ?? 1e9 : 1e9

let asset = AVURLAsset(url: url)
let duration = CMTimeGetSeconds(asset.duration)
let track = asset.tracks(withMediaType: .video).first!
let transform = track.preferredTransform
let nominal = track.naturalSize.applying(transform)
let vw = abs(nominal.width), vh = abs(nominal.height)

let reader = try! AVAssetReader(asset: asset)
let settings: [String: Any] = [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA]
let output = AVAssetReaderTrackOutput(track: track, outputSettings: settings)
output.alwaysCopiesSampleData = false
reader.add(output)
reader.startReading()

let ciContext = CIContext(options: [.useSoftwareRenderer: false])
var frames: [FrameFaces] = []
var frameIndex = 0
let interval = max(1, Int(round((track.nominalFrameRate / Float(sampleFPS)).rounded())))
while let sample = output.copyNextSampleBuffer() {
    defer { frameIndex += 1 }
    if frameIndex % interval != 0 { continue }
    let t = CMTimeGetSeconds(CMSampleBufferGetPresentationTimeStamp(sample))
    if t < startT { continue }
    if t > endT { break }
    guard let pb = CMSampleBufferGetImageBuffer(sample) else { continue }
    var ci = CIImage(cvPixelBuffer: pb)
    if transform != .identity { ci = ci.transformed(by: transform) }
    let rect = ci.extent
    let req = VNDetectFaceRectanglesRequest()
    req.revision = VNDetectFaceRectanglesRequestRevision3
    req.preferBackgroundProcessing = false
    let handler = VNImageRequestHandler(ciImage: ci, orientation: .up, options: [:])
    do {
        try handler.perform([req])
    } catch { continue }
    var boxes: [FaceBox] = []
    for o in (req.results ?? []) {
        let bb = o.boundingBox
        // Convert Vision bottom-left normalized to top-left pixel-normalized.
        let x = Double(bb.minX)
        let y = 1.0 - Double(bb.maxY)
        let w = Double(bb.width)
        let h = Double(bb.height)
        boxes.append(FaceBox(x: x, y: y, w: w, h: h, confidence: Double(o.confidence)))
    }
    frames.append(FrameFaces(t: t, faces: boxes))
    if frames.count % 300 == 0 { FileHandle.standardError.write("detected \(frames.count) frames at \(String(format: "%.1f", t))s\n".data(using: .utf8)!) }
}
let enc = JSONEncoder()
enc.outputFormatting = [.withoutEscapingSlashes]
let data = try! enc.encode(frames)
try! data.write(to: outURL)
print("wrote \(outURL.path) frames=\(frames.count) totalFaceBoxes=\(frames.reduce(0){$0+$1.faces.count}) duration=\(duration) size=\(vw)x\(vh)")
