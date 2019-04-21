export function numberedList(array: any[], prop: any) {
    let response = '';
    for (let i = 0; i < array.length; i++) {
        let val = prop ? array[i][prop] : array[i];
        response += `。[**${i + 1}**]　→　\'*${val}*\'\n`
    }
    return response;
}

export function hyperlinkedList(array: any[], text: string, hyperlink: string) {
    let response = '';
    for (let i = 0; i < array.length; i++) {
        let val = text ? array[i][text] : array[i];
        let link = hyperlink ? array[i][hyperlink] : '';
        response += `。[${val}](${link})\n`
    }
    return response;
}