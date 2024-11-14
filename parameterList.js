export default class ParameterList {
    parameterList() {
        this.poseHeight =  0;
        this.armSpan = 0;
        this.feetSpan = 0;
        this.leftHandSpan = 0;
        this.rightHandSpan = 0;
        this.leftFeetSpan = 0;
        this.rightFeetSpan = 0; 
        this.centerTop = 0;
        this.centerBottom = 0;
    }

    update(new_list) {
        for (let [key, value] of ParameterList.entries(new_list)) {
            this[key] = value;
        }
    }

    set(ph, as, fs, lhs, rhs, lfs, rfs, ct, cb) {
        this.poseHeight =  ph;
        this.armSpan = as;
        this.feetSpan = fs;
        this.leftHandSpan = lhs;
        this.rightHandSpan = rhs;
        this.leftFeetSpan = lfs;
        this.rightFeetSpan = rfs; 
        this.centerTop = ct;
        this.centerBottom = cb;
    }
}