// tslint:disable:jsx-no-multiline-js
import React, {Component} from 'react';
import {Form, Input, Button} from 'antd';
import { ChildProps } from 'react-apollo';
const FormItem = Form.Item;

export interface Props {
  addTodo: ({content}: {content: string}) => Promise<any>;
  form: any;
  userId: string;
}

class TodoForm extends Component<ChildProps<Props, any>> {
  public handleSubmit = (e: any) => {
    e.preventDefault();
    this.props.form.validateFields((err, values) => {
      if (!err) {
        this.props.addTodo({userId: this.props.userId, ...values});
      }
    });
  }

  public render() {
    const {getFieldDecorator} = this.props.form;
    return (
      <Form layout='inline' onSubmit={this.handleSubmit}>
      <FormItem>
        {getFieldDecorator('content', {
          rules: [{required: true, message: 'Please input your content!'}]
        })(
          <Input placeholder='Content' />
        )}
      </FormItem>
      <FormItem>
        <Button
          type='primary'
          htmlType='submit'
        >
          Create Todo
        </Button>
      </FormItem>
      </Form>
    );
  }
}

export default Form.create()(TodoForm);
