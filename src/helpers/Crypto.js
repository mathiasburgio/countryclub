const crypto = require('crypto');
const bcrypt = require("bcrypt");

const crypto_options = {
    algorithm: 'aes-256-cbc',
    ENC_KEY : 'fz3c199c2470cc57zp907b1e0917c17b',
    IV : "5183666c72eec9e4"
};

module.exports.encryptString = (val) => {
    val = val.toString().trim();
    if(val == ""){return "";}
    let cipher = crypto.createCipheriv(crypto_options.algorithm, crypto_options.ENC_KEY, crypto_options.IV);
    let encrypted = cipher.update(val, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return encrypted + "__ENC__";
};
module.exports.decryptString = (val) => {
    val = val.toString().trim();
    if(val.substring(val.length - 7) == "__ENC__"){
        val = val.substring(0,val.length - 7);
        if(val == ""){return "";}
        let decipher = crypto.createDecipheriv(crypto_options.algorithm, crypto_options.ENC_KEY, crypto_options.IV);
        let decrypted = decipher.update(val, 'base64', 'utf8');
        return (decrypted + decipher.final('utf8'));
    }else{
        return "";
    }
};
module.exports.getPasswordHash = async function(field_password){
    let salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(field_password, salt);
}
module.exports.comparePasswordHash = async function(field_password, bd_password){
    return await bcrypt.compare(field_password, bd_password);
}