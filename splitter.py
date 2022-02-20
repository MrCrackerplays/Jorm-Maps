import os
import math
#pip install pillow to use PIL
from PIL import Image

image_name = "GreaterDodestron"
exten = ".png"
output_folder = "1"
im = Image.open(image_name + exten)
width_in_tiles = math.ceil(im.width / 256)
heigth_in_tiles = math.ceil(im.height / 256)

if not os.path.exists(output_folder):
	os.makedirs(output_folder)
	print("Created directory: " + output_folder)

print("converting files...")
crop_directory = os.path.join(os.getcwd(), output_folder)
for i in range(width_in_tiles):
	for j in range(heigth_in_tiles):
		final_directory = os.path.join(crop_directory, str(j))
		if not os.path.exists(final_directory):
			os.makedirs(final_directory)
			print("Created directory: " + final_directory)
		im.transform((256, 256), Image.EXTENT, (i * 256, j * 256, (i + 1) * 256, (j + 1) * 256)).save(final_directory + "/" + str(i) + ".png")
print("done")