# create a distributable js file with all the contents of the src folder

input_folder = 'src'
output_file = 'net-vis.js'

import os

def build_from_source_folder(folder, fout):
    for fname in os.listdir(folder):
        fpath = os.path.join(folder,fname)
        if os.path.isdir(fpath):
            build_from_source_folder(fpath,fout)
        else:
            with open(fpath,'r') as fin:
                while True:
                    line = fin.readline()
                    if not line:
                        break
                    fout.write(line)
    

with open(output_file,'w') as fout:
    build_from_source_folder(input_folder, fout)