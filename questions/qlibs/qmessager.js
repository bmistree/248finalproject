function close_message(amt_to_pay)
{
    var parent_msg_target = parent.postMessage ? parent : (parent.document.postMessage ? parent.document : undefined);
    var msg_contents = amt_to_pay.toString();
    $.postMessage(
        msg_contents,
        '*',
        parent_msg_target
    );
}

