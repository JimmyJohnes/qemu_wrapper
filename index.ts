import path from "node:path"
import fs from "node:fs"
import { execSync,exec } from "node:child_process";
import { QEMUImage } from "./image.model";
import { ISOImage } from "./iso.model";
import { VM } from "./vm.model";

class QEMU{
  private __workingDirectory: string;
  constructor(workingDirectory = __dirname){
    if (path.isAbsolute(workingDirectory)) {
      this.__workingDirectory = workingDirectory;
    }
    else{
      this.__workingDirectory = path.resolve(__dirname,workingDirectory);
    }
    if(!fs.existsSync(this.__workingDirectory)){
      fs.mkdirSync(this.__workingDirectory);
    }
  }
  public get workingDirectory(){
    return this.__workingDirectory;

  }
  public set workingDirectory(workingDirectory: string){
    if (path.isAbsolute(workingDirectory)) {
      this.__workingDirectory = workingDirectory;
    }
    else{
      this.__workingDirectory = path.resolve(__dirname,workingDirectory);
    }
    if(!fs.existsSync(this.__workingDirectory)){
      fs.mkdirSync(this.__workingDirectory);
    }
  }
  public createVirtualDisk(name: string, size: number, format: string){
    /**
   * Creates a new virtual machine disk image using QEMU.
   * 
   * @param {string} name - The name of the disk file
   * @param {number} size - The size of the disk in Gigabytes
   * @param {string} format - The format of the disk (allowed: 'qcow2', 'raw')
   * @returns {object} - Returns an object with status and either image details or error message
   *                     {status: "success", image: {location: string}} on success
   *                     {status: "failed", message: string} on failure
   * @example
   * // Create a 20GB qcow2 image named "ubuntu-vm"
   * const result = createVirtualMachine("ubuntu-vm", 20, "qcow2");
   * if (result.status === "failed") {
   *   console.error(result.message); // Handle error
   * } else {
   *   console.log(`Created VM image at ${result.image.location}`);
   * }
   */
    let allowedFormates = ["qcow2","raw"]
    if(!allowedFormates.includes(format)){
      return {
        status: "failed",
        message: `Invalid format, allowed formats ${allowedFormates}`
      }
    }
    let imageDirectory = path.resolve(this.__workingDirectory, name)
    try{
      execSync(`qemu-img create -f ${format} ${imageDirectory}.img ${size}G`)
      let image = new QEMUImage(name,size,format,imageDirectory);
      return {
        status: "success",
        message: "Disk Image created successfully",
        image: image
      }
    }catch(e){
      return {
        status: "failed",
        message: e
      }
    }
  }
  public createVirtualDiskFromImage(image: QEMUImage): object{
   /**
   * Creates a new virtual machine disk image from an existing QEMUImage configuration.
   * 
   * @param {QEMUImage} image - The Image object containing name, size, and format properties
   * @returns {object} - Returns an object with status and either image details or error message
   *                     {status: "success", image: QEMUImage} on success
   *                     {status: "failed", message: string} on failure
   * @example
   * // Create a disk from an existing image configuration
   * const imageConfig = {
   *   name: "ubuntu-vm",
   *   size: "20",
   *   format: "qcow2"
   * };
   * const result = createVirtualDiskFromImage(imageConfig);
   * if (result.status === "failed") {
   *   console.error(result.message); // Handle error
   * } else {
   *   console.log(`Created VM image at ${result.image.location}`);
   * }
   */
    let name = image.name;
    let size = parseInt(image.size);
    let format = image.format
    let allowedFormates = ["qcow2","raw"]
    if(!allowedFormates.includes(format)){
      return {
        status: "failed",
        message: `Invalid format, allowed formats ${allowedFormates}`
      }
    }
    let imageDirectory = path.resolve(this.__workingDirectory, name)
    try{
      execSync(`qemu-img create -f ${format} ${imageDirectory}.img ${size}G`)
      image.location = imageDirectory;
      return {
        status: "success",
        message: "Disk Image created successfully",
        image: image
      }
    }catch(e){
      return {
        status: "failed",
        message: e
      }
    }
  }
  public deleteVirtualDiskFromImage(image:QEMUImage){
   /**
   * Deletes a virtual machine disk image file.
   * 
   * @param {QEMUImage} image - The Image object containing a location property pointing to the disk file
   * @returns {object} - Returns an object with status and message
   *                     {status: "success", message: string} on successful deletion
   *                     {status: "failed", message: string} if the image doesn't exist
   * @example
   * // Delete a disk image
   * const imageToDelete = {
   *   location: "/path/to/ubuntu-vm.img"
   * };
   * const result = deleteVirtualDiskFromImage(imageToDelete);
   * if (result.status === "failed") {
   *   console.error(result.message); // Handle error
   * } else {
   *   console.log(result.message); // "Image deleted successfully"
   * }
   */
    if(!fs.existsSync(image.location!)){
      return {
        status: "failed",
        message: "Disk Image doesn't exist"
      };
    }
    fs.unlinkSync(image.location!);
    return {
      status: "success",
      message: "Image deleted successfully"
    };
  }
  public createVirtualMachineUsingImage(name:string, iso:ISOImage, memory: number,image:QEMUImage){
    if(!image.location!) return {status: "failed", message: "Disk image doesn't exist"}
    try {
      exec(`qemu-system-x86_64 -enable-kvm -cdrom ${iso.location} -boot menu=on -drive file=${image.location} -m ${memory}G`, (error,stdout)=>{});
      let vm  = new VM(name,iso,memory,image);
      return{
        status: "success",
        message: "Created VM successfully",
        vm: vm
      }
    } catch (error) {
      return{
        status: "failed",
        message: error
      }
    }
  }
}

let qemu = new QEMU("vms");
let image = qemu.createVirtualDisk("foo",15,"qcow2");
let ManjaroIso = new ISOImage("Manjaro","/home/jimmy/ISO/manjaro-kde-24.0.6-240812-linux69.iso")
let vm = qemu.createVirtualMachineUsingImage("idk",ManjaroIso,8,image.image!);