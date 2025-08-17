#!/usr/bin/env python3
"""
SVG to PNG Converter for Dev.to Image Upload

This script converts SVG files to PNG format to avoid Dev.to's image URL transformation issues.
Dev.to automatically transforms external image URLs which can break SVG rendering.

Usage:
    python convert_svg_to_png.py

The script will:
1. Find all SVG files in public/assets/images/07/
2. Convert them to PNG format using Playwright browser automation
3. Save PNG files in the same directory
4. Update the markdown file to use PNG instead of SVG
"""

import os
import re
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

async def convert_svg_to_png(svg_path, png_path, width=1200, height=800):
    """
    Convert SVG file to PNG with specified dimensions using Playwright
    """
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            page = await browser.new_page()
            
            # Set viewport size
            await page.set_viewport_size({"width": width, "height": height})
            
            # Create HTML with SVG content
            with open(svg_path, 'r', encoding='utf-8') as f:
                svg_content = f.read()
            
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ margin: 0; padding: 20px; background: white; }}
                    svg {{ max-width: 100%; height: auto; }}
                </style>
            </head>
            <body>
                {svg_content}
            </body>
            </html>
            """
            
            await page.set_content(html_content)
            
            # Wait for SVG to load
            await page.wait_for_timeout(1000)
            
            # Take screenshot
            await page.screenshot(path=str(png_path), full_page=True)
            
            await browser.close()
        
        print(f"✅ Converted: {svg_path.name} -> {png_path.name}")
        return True
        
    except Exception as e:
        print(f"❌ Error converting {svg_path.name}: {e}")
        return False

def update_markdown_file(md_path, svg_to_png_mapping):
    """
    Update markdown file to use PNG instead of SVG
    """
    try:
        with open(md_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Replace SVG URLs with PNG URLs
        for svg_name, png_name in svg_to_png_mapping.items():
            svg_pattern = f"https://wintrover.github.io/blog/assets/images/07/{svg_name}"
            png_replacement = f"https://wintrover.github.io/blog/assets/images/07/{png_name}"
            content = content.replace(svg_pattern, png_replacement)
        
        with open(md_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"✅ Updated markdown file: {md_path.name}")
        return True
        
    except Exception as e:
        print(f"❌ Error updating markdown file: {e}")
        return False

async def main():
    # Define paths
    images_dir = Path("public/assets/images/07")
    md_file = Path("public/_posts/2025-08-10-7.md")
    
    if not images_dir.exists():
        print(f"❌ Images directory not found: {images_dir}")
        return
    
    if not md_file.exists():
        print(f"❌ Markdown file not found: {md_file}")
        return
    
    # Find all SVG files
    svg_files = list(images_dir.glob("*.svg"))
    
    if not svg_files:
        print("❌ No SVG files found in the images directory")
        return
    
    print(f"Found {len(svg_files)} SVG files to convert:")
    for svg_file in svg_files:
        print(f"  - {svg_file.name}")
    
    # Convert SVG to PNG
    svg_to_png_mapping = {}
    
    for svg_file in svg_files:
        png_file = svg_file.with_suffix('.png')
        
        if await convert_svg_to_png(svg_file, png_file):
            svg_to_png_mapping[svg_file.name] = png_file.name
    
    if svg_to_png_mapping:
        print(f"\n📝 Updating markdown file to use PNG images...")
        update_markdown_file(md_file, svg_to_png_mapping)
        
        print(f"\n🎉 Conversion completed!")
        print(f"Converted {len(svg_to_png_mapping)} files:")
        for svg_name, png_name in svg_to_png_mapping.items():
            print(f"  {svg_name} -> {png_name}")
    else:
        print("❌ No files were successfully converted")

if __name__ == "__main__":
    asyncio.run(main())