Add-Type -AssemblyName System.Drawing

$imgPath = Join-Path $PWD "model icon.jpg"
$img = [System.Drawing.Image]::FromFile($imgPath)

function CreateRoundIcon($size, $outputPath) {
    $bmp = new-object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    
    # Enable high quality rendering
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    
    # Clear with transparent background
    $g.Clear([System.Drawing.Color]::Transparent)
    
    # Create circular path
    $path = new-object System.Drawing.Drawing2D.GraphicsPath
    $path.AddEllipse(0, 0, $size, $size)
    $g.SetClip($path)
    
    # Draw the image
    $g.DrawImage($img, 0, 0, $size, $size)
    
    # Save as PNG
    $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    
    # Cleanup
    $path.Dispose()
    $g.Dispose()
    $bmp.Dispose()
}

$path192 = Join-Path $PWD "public\icon-192x192.png"
$path512 = Join-Path $PWD "public\icon-512x512.png"

CreateRoundIcon 192 $path192
CreateRoundIcon 512 $path512

$img.Dispose()
